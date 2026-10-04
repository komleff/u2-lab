#!/usr/bin/env node
// Движок проигрывания очереди заявок Beads (.bd-intents/<branch>.jsonl) в живую базу.
// Запускается ТОЛЬКО из доверенного основного checkout через scripts/bd-apply-intents.sh
// (тот делает env-guard, fetch снимка и bd export). См. ADR-0042.
//
// Две фазы: (1) валидация ВСЕЙ очереди — при ошибке ВАЛИДАЦИИ ноль мутаций; (2) выполнение.
// NB: «ноль мутаций» гарантировано только для фазы 1. Ошибка ИСПОЛНЕНИЯ (фаза 2, напр. сбой bd
// в середине) может оставить частичную мутацию — она докатывается идемпотентным повтором.
// Идемпотентность — на уровне источника истины (живой базы), не только receipt:
//   create  → маркер --external-ref intent:<id>; уже в индексе → не создаём;
//   note/comment → маркер [intent:<id>] в тексте; уже в заметках/комментах → пропуск;
//   close   → пропуск, если уже closed; dep_add → пропуск, если ребро уже есть;
//   update  → выставляет заявленные значения (идемпотентно по конечному состоянию).
// bd вызывается через execFileSync с массивом argv — без shell-склейки и eval.

import { readFileSync, writeFileSync, renameSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// --- разбор аргументов ---
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const has = (name) => args.includes(name);
const QUEUE = opt('--queue');
const RECEIPT = opt('--receipt');
const INDEX = opt('--index');       // свежий bd export --all (живая база)
const REMOTE = opt('--remote');     // снимок origin/beads-backup (может отсутствовать)
const BD = opt('--bd') || 'bd';
const SUMMARY = opt('--summary-file');
const DRY = has('--dry-run');
const SKIP_SYNC = has('--skip-sync-check');

const die = (msg) => { console.error(`ERROR: ${msg}`); process.exit(1); };
if (!QUEUE || !RECEIPT || !INDEX) die('нужны --queue, --receipt, --index');

// --- разбор JSONL: только issues, без служебных _type:memory ---
// Fail-closed: непустая строка, не парсящаяся как JSON, = повреждённый снимок → стоп
// (иначе divergence-check считался бы по частичному снимку и мог пропустить расхождение).
const parseIssues = (path, label) => {
  if (!path || !existsSync(path)) return [];
  const out = [];
  readFileSync(path, 'utf8').split(/\n/).forEach((line, i) => {
    const s = line.trim();
    if (!s) return;
    let o;
    try { o = JSON.parse(s); }
    catch { die(`${label || path}: строка ${i + 1} — невалидный JSON (снимок повреждён, fail-closed)`); }
    if (o && o._type === 'memory') return;
    if (o && o.id) out.push(o);
  });
  return out;
};

// --- индекс живой базы ---
const liveIssues = parseIssues(INDEX, 'live export (bd export --all)');
const byId = new Map();          // id -> issue
const extRefToId = new Map();    // external_ref -> id
for (const it of liveIssues) {
  byId.set(it.id, it);
  if (it.external_ref) extRefToId.set(it.external_ref, it.id);
}

// --- проверка расхождения с origin/beads-backup (до любых мутаций) ---
if (!SKIP_SYNC && REMOTE && existsSync(REMOTE)) {
  const remoteIssues = parseIssues(REMOTE, 'origin/beads-backup snapshot');
  // Сигнатура по ПОЛНОМУ содержимому задачи (канонический JSON с сортировкой ключей),
  // не только updated_at: правки зависимостей/notes/статуса без bump'а timestamp тоже
  // должны детектиться, иначе export затёр бы remote-only изменения.
  const stable = (v) => Array.isArray(v) ? '[' + v.map(stable).join(',') + ']'
    : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}'
    : JSON.stringify(v);
  const sig = (issues) => {
    const m = new Map();
    for (const it of issues) m.set(it.id, stable(it));
    return m;
  };
  const a = sig(liveIssues), b = sig(remoteIssues);
  const diverged = [];
  for (const [id, u] of a) if (b.get(id) !== u) diverged.push(id);
  for (const [id] of b) if (!a.has(id)) diverged.push(id);
  if (diverged.length) {
    console.error('ERROR: локальная база Beads расходится с origin/beads-backup ' +
      `(${diverged.length} задач, напр. ${diverged.slice(0, 5).join(', ')}).`);
    console.error('       Есть неопубликованные локальные изменения или remote ушёл вперёд.');
    console.error('       Сведите состояние (scripts/bd-sync-export.sh или bd-sync-restore.sh) до apply,');
    console.error('       либо BD_APPLY_SKIP_SYNC_CHECK=1 если уверены (напр. e2e на временной базе).');
    process.exit(2);
  }
}

// --- whitelist операций и полей ---
const COMMON = new Set(['intent_id', 'op', 'created_at', 'actor']);
const FIELDS = {
  create:  new Set(['handle', 'title', 'type', 'priority', 'description', 'assignee', 'acceptance', 'labels', 'notes']),
  close:   new Set(['ref', 'close_reason']),
  update:  new Set(['ref', 'status', 'priority', 'assignee', 'type']),
  dep_add: new Set(['ref', 'blocked_by', 'dep_type']),
  note:    new Set(['ref', 'text']),
  comment: new Set(['ref', 'text']),
};
const MAXLEN = 8000;

// --- фаза 1: валидация всей очереди ---
const rawLines = existsSync(QUEUE) ? readFileSync(QUEUE, 'utf8').split(/\n/) : [];
const intents = [];
const errors = [];
const seenIntentIds = new Set();
const declaredHandles = new Set();   // tmp:-хэндлы, объявленные create'ами выше по файлу

const isTmp = (v) => typeof v === 'string' && v.startsWith('tmp:');
const REAL_RE = /^ulab-[A-Za-z0-9]+(?:\.[0-9]+)*$/;          // реальный id Beads
const TMP_RE = /^tmp:[A-Za-z0-9._-]{1,64}$/;  // локальный хэндл
const INTENT_RE = /^[A-Za-z0-9._:-]{1,64}$/;
const STATUSES = new Set(['open', 'in_progress', 'blocked', 'deferred', 'closed']);
// Зеркалит типы, которые `bd create --help` документирует как принимаемые (контракт-тест
// сверяет с create --help). Кастомные типы (types.custom) в U2 Lab не сконфигурированы. spike/
// story/milestone из `bd types` сюда НЕ включены: create --help их как принимаемые не
// документирует — консервативно отвергаем (ложный приём = частичная мутация в фазе 2).
const TYPES = new Set(['task', 'bug', 'feature', 'chore', 'epic', 'decision']);
const DEP_TYPES = new Set(['blocks', 'related', 'parent-child', 'discovered-from', 'relates-to']);
const STR_FIELDS = ['title', 'description', 'assignee', 'acceptance', 'labels', 'notes',
  'close_reason', 'text', 'status', 'type', 'dep_type', 'handle', 'ref', 'blocked_by', 'created_at', 'actor'];
const isPrio = (v) => /^(P?[0-4])$/.test(String(v));
// Проверка ссылки ДО мутаций: только tmp: (объявлен create'ом выше) либо ulab-… (есть в живой
// базе) — ровно контракт очереди из .bd-intents/README.md. external:* НЕ поддержан: не
// задокументирован в контракте и не покрыт проверкой реального `bd dep add`.
const refError = (val) => {
  if (typeof val !== 'string' || !val) return 'пустой ref';
  if (TMP_RE.test(val)) return declaredHandles.has(val) ? null : `ссылка на необъявленный хэндл ${val}`;
  if (REAL_RE.test(val)) return byId.has(val) ? null : `ref ${val} не найден в живой базе`;
  return `некорректный ref '${val}'`;
};

rawLines.forEach((line, i) => {
  const s = line.trim();
  if (!s) return;
  const ln = i + 1;
  let o; try { o = JSON.parse(s); } catch { errors.push(`строка ${ln}: невалидный JSON`); return; }
  if (typeof o !== 'object' || o === null || Array.isArray(o)) { errors.push(`строка ${ln}: не объект`); return; }
  const { intent_id, op } = o;
  if (typeof intent_id !== 'string' || !INTENT_RE.test(intent_id)) { errors.push(`строка ${ln}: нет/некорректный intent_id`); return; }
  if (seenIntentIds.has(intent_id)) { errors.push(`строка ${ln}: дубль intent_id ${intent_id}`); return; }
  seenIntentIds.add(intent_id);
  if (!FIELDS[op]) { errors.push(`строка ${ln}: неизвестный op '${op}'`); return; }
  const allowed = FIELDS[op];
  for (const k of Object.keys(o)) {
    if (!COMMON.has(k) && !allowed.has(k)) errors.push(`строка ${ln} (${op}): лишний ключ '${k}'`);
  }
  // строковые поля обязаны быть строками (иначе argv → ERR_INVALID_ARG_TYPE уже после ранних мутаций)
  for (const f of STR_FIELDS) {
    if (f in o && typeof o[f] !== 'string') { errors.push(`строка ${ln} (${op}): поле '${f}' должно быть строкой`); continue; }
    if (typeof o[f] !== 'string') continue;
    if (o[f].length > MAXLEN) errors.push(`строка ${ln} (${op}): поле '${f}' длиннее ${MAXLEN}`);
    // Управляющие символы (NUL + terminal-escape-injection при выводе bd-read/логов/терминала),
    // кроме TAB(9) и LF(10). NUL дополнительно ломал бы execFileSync после ранних мутаций.
    if (Array.from(o[f]).some((c) => { const n = c.charCodeAt(0); return n === 127 || (n < 32 && n !== 9 && n !== 10); })) errors.push(`строка ${ln} (${op}): поле '${f}' содержит управляющий символ`);
    // Зарезервированный маркер идемпотентности: пользовательский '[intent:' мог бы дать ложный skip note/comment.
    if (o[f].includes('[intent:')) errors.push(`строка ${ln} (${op}): поле '${f}' содержит зарезервированную последовательность [intent:`);
  }
  if ('priority' in o && !isPrio(o.priority)) errors.push(`строка ${ln} (${op}): priority вне 0..4 / P0..P4`);

  if (op === 'create') {
    if (typeof o.title !== 'string' || !o.title.trim()) errors.push(`строка ${ln} (create): пустой title`);
    if (o.handle !== undefined && !TMP_RE.test(o.handle)) errors.push(`строка ${ln} (create): handle должен быть вида tmp:<slug>`);
    if (TMP_RE.test(o.handle)) {
      if (declaredHandles.has(o.handle)) errors.push(`строка ${ln} (create): повторный хэндл ${o.handle}`);
      declaredHandles.add(o.handle);
    }
    if ('type' in o && !TYPES.has(o.type)) errors.push(`строка ${ln} (create): неизвестный type '${o.type}'`);
  } else {
    const e = refError(o.ref); if (e) errors.push(`строка ${ln} (${op}): ${e}`);
  }
  if (op === 'dep_add') {
    const e = refError(o.blocked_by); if (e) errors.push(`строка ${ln} (dep_add): blocked_by — ${e}`);
    if ('dep_type' in o && !DEP_TYPES.has(o.dep_type)) errors.push(`строка ${ln} (dep_add): неизвестный dep_type '${o.dep_type}'`);
  }
  if (op === 'close' && (typeof o.close_reason !== 'string' || !o.close_reason)) errors.push(`строка ${ln} (close): нет close_reason`);
  if (op === 'update') {
    if ('status' in o && !STATUSES.has(o.status)) errors.push(`строка ${ln} (update): неизвестный status '${o.status}'`);
    if ('type' in o && !TYPES.has(o.type)) errors.push(`строка ${ln} (update): неизвестный type '${o.type}'`);
    if (!('status' in o) && !('priority' in o) && !('assignee' in o) && !('type' in o)) errors.push(`строка ${ln} (update): нет полей для обновления`);
  }
  if ((op === 'note' || op === 'comment') && (typeof o.text !== 'string' || !o.text)) errors.push(`строка ${ln} (${op}): нет text`);
  intents.push({ ln, o });
});

if (errors.length) {
  console.error(`ВАЛИДАЦИЯ НЕ ПРОЙДЕНА (${errors.length}) — ноль мутаций:`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

// --- фаза 2: выполнение ---
let receipt = { version: 1, applied: {}, handles: {} };
if (existsSync(RECEIPT)) { try { receipt = JSON.parse(readFileSync(RECEIPT, 'utf8')); } catch { /* перезапишем */ } }
receipt.applied ||= {}; receipt.handles ||= {};

const handleMap = new Map(Object.entries(receipt.handles));   // tmp -> real id
// досев из живой базы: применённые create по маркеру external_ref
const flushReceipt = () => {
  if (DRY) return;
  receipt.handles = Object.fromEntries(handleMap);
  const tmp = RECEIPT + '.tmp';
  writeFileSync(tmp, JSON.stringify(receipt, null, 2));
  renameSync(tmp, RECEIPT);
};
const bd = (argv) => execFileSync(BD, argv, { encoding: 'utf8' });
// note поддерживает --stdin; comments add читает только обычный --file (даже "-"
// означает имя файла). Текст не попадает в argv; флаги-значения — одним токеном.
const bdIn = (argv, input) => execFileSync(BD, argv, { encoding: 'utf8', input });
const bdComment = (target, text) => {
  const dir = mkdtempSync(join(tmpdir(), 'ulab-bd-comment-'));
  try {
    const file = join(dir, 'comment.txt');
    writeFileSync(file, text, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    bd(['comments', 'add', target, `--file=${file}`]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
const resolveRef = (v) => (isTmp(v) ? (handleMap.get(v) || null) : v);

const counts = { create: 0, close: 0, update: 0, dep_add: 0, note: 0, comment: 0, skipped: 0 };
let mutations = 0;
const log = (m) => console.log((DRY ? '[dry-run] ' : '') + m);

for (const { ln, o } of intents) {
  const marker = `intent:${o.intent_id}`;
  if (o.op === 'create') {
    const handle = o.handle;
    const existing = extRefToId.get(marker);
    if (existing) { if (handle) handleMap.set(handle, existing); counts.skipped++; log(`create ${o.intent_id}: уже есть (${existing}) — пропуск`); flushReceipt(); continue; }
    if (DRY) { if (handle) handleMap.set(handle, `DRY-${o.intent_id}`); counts.create++; mutations++; log(`create "${o.title}" (-> ${handle || '?'})`); continue; }
    const argv = ['create', `--title=${o.title}`, `--type=${o.type || 'task'}`, `--priority=${String(o.priority ?? '2')}`];
    if (o.description) argv.push(`--description=${o.description}`);
    if (o.assignee) argv.push(`--assignee=${o.assignee}`);
    if (o.acceptance) argv.push(`--acceptance=${o.acceptance}`);
    if (o.labels) argv.push(`--labels=${o.labels}`);
    if (o.notes) argv.push(`--notes=${o.notes}`);
    argv.push(`--external-ref=${marker}`, '--silent');
    const id = bd(argv).trim().split(/\s+/).pop();
    if (!id) die(`строка ${ln}: bd create не вернул ID`);
    if (handle) handleMap.set(handle, id);   // create без handle не плодит ключ "undefined" в receipt
    extRefToId.set(marker, id);
    // Заполняем индекс ФАКТИЧЕСКИ заданными при create полями — чтобы последующий update в той
    // же очереди не делал лишнюю мутацию по уже выставленным значениям.
    byId.set(id, { id, status: 'open', priority: o.priority ?? '2', issue_type: o.type || 'task',
      assignee: o.assignee, notes: '', comments: [], dependencies: [], external_ref: marker });
    counts.create++; mutations++; receipt.applied[o.intent_id] = { op: 'create', result_id: id };
    log(`create -> ${id}`); flushReceipt(); continue;
  }
  const target = resolveRef(o.ref);
  if (!target) die(`строка ${ln} (${o.op}): не разрешён ref ${o.ref}`);
  const issue = byId.get(target);

  if (o.op === 'close') {
    if (issue && issue.status === 'closed') { counts.skipped++; log(`close ${target}: уже closed — пропуск`); continue; }
    if (!DRY) bd(['close', target, `--reason=${o.close_reason}`]);
    if (issue) issue.status = 'closed';
    counts.close++; mutations++; receipt.applied[o.intent_id] = { op: 'close', target };
    log(`close ${target}`); flushReceipt(); continue;
  }
  if (o.op === 'dep_add') {
    const blocker = resolveRef(o.blocked_by);
    if (!blocker) die(`строка ${ln} (dep_add): не разрешён blocked_by ${o.blocked_by}`);
    const depType = o.dep_type || 'blocks';
    const deps = (issue && issue.dependencies) || [];
    if (deps.some((d) => d.depends_on_id === blocker && (d.type || 'blocks') === depType)) { counts.skipped++; log(`dep_add ${target}<-${blocker} (${depType}): ребро есть — пропуск`); continue; }
    const argv = ['dep', 'add', target, `--blocked-by=${blocker}`];
    if (o.dep_type) argv.push(`--type=${o.dep_type}`);
    if (!DRY) bd(argv);
    if (issue) (issue.dependencies ||= []).push({ depends_on_id: blocker, type: o.dep_type || 'blocks' });
    counts.dep_add++; mutations++; receipt.applied[o.intent_id] = { op: 'dep_add', target, blocker };
    log(`dep_add ${target} <- ${blocker}`); flushReceipt(); continue;
  }
  if (o.op === 'note' || o.op === 'comment') {
    let comments = (issue && issue.comments) || [];
    // export bd 0.62 содержит только comment_count. Для восстановления после потери
    // receipt читаем тексты отдельно; ошибка CLI/JSON не означает отсутствие маркера.
    // Созданная лишь в dry-run задача ещё не существует в базе.
    if (o.op === 'comment' && !(DRY && !issue)) {
      comments = JSON.parse(bd(['comments', target, '--json']));
      if (!Array.isArray(comments) || comments.some((c) => !c || typeof c.text !== 'string')) {
        die(`строка ${ln}: bd comments ${target} вернул неверную форму JSON`);
      }
    }
    const haystack = `${(issue && issue.notes) || ''}\n${comments.map((c) => c.text).join('\n')}`;
    // Точный токен с границами `[intent:<id>]`, НЕ голая подстрока `intent:<id>` — иначе
    // intent_id-префикс ложно совпал бы (intent:ab ⊂ intent:abc) и заявку молча пропустило бы.
    const token = `[${marker}]`;
    if (haystack.includes(token)) { counts.skipped++; log(`${o.op} ${target}: маркер есть — пропуск`); continue; }
    const text = `${o.text}\n\n${token}`;
    if (!DRY) {
      if (o.op === 'note') bdIn(['note', target, '--stdin'], text);
      else bdComment(target, text);
    }
    counts[o.op]++; mutations++; receipt.applied[o.intent_id] = { op: o.op, target };
    log(`${o.op} ${target}`); flushReceipt(); continue;
  }
  if (o.op === 'update') {
    // Идемпотентность: применяем только реально отличающиеся поля (иначе повторный
    // прогон зря бампал бы updated_at/history и плодил лишние экспорты).
    const cur = issue || {};
    const fields = [];
    if (o.status !== undefined && o.status !== cur.status) fields.push([`--status=${o.status}`, 'status', o.status]);
    if (o.priority !== undefined && String(o.priority) !== String(cur.priority)) fields.push([`--priority=${String(o.priority)}`, 'priority', o.priority]);
    if (o.assignee !== undefined && o.assignee !== cur.assignee) fields.push([`--assignee=${o.assignee}`, 'assignee', o.assignee]);
    if (o.type !== undefined && o.type !== cur.issue_type) fields.push([`--type=${o.type}`, 'issue_type', o.type]);
    if (!fields.length) { counts.skipped++; log(`update ${target}: значения уже совпадают — пропуск`); continue; }
    if (!DRY) bd(['update', target, ...fields.map((f) => f[0])]);
    if (issue) for (const [, key, val] of fields) issue[key] = val;   // обновляем индекс для последующих заявок батча
    counts.update++; mutations++; receipt.applied[o.intent_id] = { op: 'update', target };
    log(`update ${target}`); flushReceipt(); continue;
  }
}

flushReceipt();
console.log(`ИТОГО: создано ${counts.create}, закрыто ${counts.close}, обновлено ${counts.update}, ` +
  `зависимостей ${counts.dep_add}, заметок ${counts.note}, комментов ${counts.comment}, пропущено ${counts.skipped}.`);
if (SUMMARY) writeFileSync(SUMMARY, JSON.stringify({ mutations, dry_run: DRY, counts }));

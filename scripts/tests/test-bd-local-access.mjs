import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, chmodSync, readdirSync, realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Локальный доступ агентов к Beads: обёртка bd-wt.sh, режим основной базы в bd-env.sh,
// шаг 4 applier. Только временные git-репозитории и заглушка bd — живая база не трогается.
const root = fileURLToPath(new URL('../../', import.meta.url));
const wrapper = join(root, 'scripts/bd-wt.sh');
const applier = join(root, 'scripts/bd-apply-intents.sh');
const envLib = join(root, 'scripts/lib/bd-env.sh');
// Системный bash macOS — 3.2; проверяем именно его, если он есть.
const BASH = existsSync('/bin/bash') ? '/bin/bash' : 'bash';

const ALLOWED = ['ready', 'show', 'list', 'search', 'blocked', 'children', 'create', 'q', 'update', 'close',
  'reopen', 'dep', 'comment', 'comments', 'note', 'label'];
const FORBIDDEN_SUBCOMMANDS = ['delete', 'config', 'init', 'sql', 'batch', 'prune', 'purge', 'flatten', 'gc',
  'compact', 'admin', 'rename-prefix', 'migrate', 'bootstrap', 'export', 'import', 'dolt'];
// Флаги, запрещённые в любой позиции, и прочие отказы до вызова bd.
const FORBIDDEN_ARGS = [
  [],
  ['--json'],
  ['--frobnicate', 'list'],
  ['--ignore-schema-skew', 'list'],
  ['list', '--ignore-schema-skew'],
  ['--db', '/other', 'list'],
  ['--db=/other', 'list'],
  ['list', '--db', '/other'],
  ['list', '--db=/other'],
  ['-C', '/other', 'list'],
  ['list', '-C', '/other'],
  ['list', '-C/other'],
  ['list', '-qC', '/other'],
  ['--directory', '/other', 'list'],
  ['list', '--directory', '/other'],
  ['list', '--directory=/other'],
  ['--global', 'list'],
  ['list', '--global'],
  ['list', '--global=true'],
  ['--', 'export'],
  // Advisory PLAN_READY: проверка по целым токенам — значение, точно равное запрещённому
  // флагу, тоже отклоняется (fail-closed, ожидаемое поведение).
  ['create', '--title', '-C'],
  ['comment', 'ulab-1', '--global'],
  ['note', 'ulab-1', '--db'],
  // `create --repo <путь>` пишет в чужую базу или создаёт новую `.beads` вне синхронизации.
  ['create', '--repo', '/other', 'x'],
  ['create', '--repo=/other', 'x'],
  ['create', 'x', '--repo', '/other'],
];

function cleanEnv(extra = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^(GIT_|BEADS_|BD_)/.test(key)) env[key] = value;
  }
  return { ...env, ...extra };
}

function git(cwd, ...args) {
  const result = spawnSync('git', ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], { cwd, encoding: 'utf8', env: cleanEnv() });
  assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stdout}${result.stderr}`);
  return result.stdout;
}

// Заглушка bd: пишет argv в журнал; на `export ... -o FILE` кладёт фикстуру снимка.
const stubCode = `#!/usr/bin/env node
const fs = require('node:fs');
const argv = process.argv.slice(2);
fs.appendFileSync(process.env.BD_LOCAL_STUB_LOG, JSON.stringify(argv) + '\\n');
const out = argv.indexOf('-o');
if (argv[0] === 'export' && out !== -1) fs.writeFileSync(argv[out + 1], fs.readFileSync(process.env.BD_LOCAL_STUB_EXPORT));
`;

// Основной checkout и linked worktree, созданная из подкаталога; в пути есть пробелы.
function fixture(t) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'ulab bd local ')));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const main = join(base, 'main checkout');
  const wt = join(base, 'linked wt');
  mkdirSync(join(main, 'sub'), { recursive: true });
  git(main, 'init', '-q', '-b', 'main');
  writeFileSync(join(main, 'sub', '.keep'), '');
  git(main, 'add', '.');
  git(main, 'commit', '-q', '-m', 'init');
  git(join(main, 'sub'), 'worktree', 'add', '-q', '-b', 'wt', wt);
  mkdirSync(join(main, '.beads'));
  const bin = join(base, 'bin');
  mkdirSync(bin);
  const stub = join(bin, 'bd');
  writeFileSync(stub, stubCode);
  chmodSync(stub, 0o755);
  const log = join(base, 'calls.log');
  writeFileSync(log, '');
  const f = {
    base, main, wt, bin, stub, log,
    meta: body => writeFileSync(join(main, '.beads', 'metadata.json'), body),
    mode: mode => f.meta(JSON.stringify({ database: 'dolt', dolt_mode: mode, backend: 'dolt' })),
    dir: name => mkdirSync(join(main, '.beads', name), { recursive: true }),
    calls: () => readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse),
    reset: () => writeFileSync(log, ''),
    wrap: (cwd, args, extra = {}) => spawnSync(BASH, [wrapper, ...args], {
      cwd, encoding: 'utf8', timeout: 20000,
      env: cleanEnv({ BD_BIN: stub, BD_LOCAL_STUB_LOG: log, ...extra }),
    }),
  };
  return f;
}

function ok(result) { assert.equal(result.status, 0, result.stdout + result.stderr); }

function resolve(f) {
  const script = '. "$1"; rc=0; bd_env_resolve_main_db "$2" || rc=$?; printf "%s|%s|%s" "$rc" "${BD_ENV_DB_MODE:-}" "${BD_ENV_DB_PATH:-}"';
  return spawnSync(BASH, ['-c', script, 'resolve', envLib, f.main], { cwd: f.wt, encoding: 'utf8', env: cleanEnv() });
}

test('AC-1: worktree + embedded → --db <main>/.beads/embeddeddolt, args unchanged, pid/port not required', t => {
  const f = fixture(t);
  f.mode('embedded'); f.dir('embeddeddolt');
  const before = readdirSync(join(f.main, '.beads')).sort();
  const args = ['create', '--title', 'Заголовок с пробелами', '--priority', '2'];
  ok(f.wrap(f.wt, args));
  assert.deepEqual(f.calls(), [['--db', join(f.main, '.beads', 'embeddeddolt'), ...args]]);
  // Инвариант: обёртка не создаёт и не меняет .beads/**.
  assert.deepEqual(readdirSync(join(f.main, '.beads')).sort(), before);
  assert.equal(existsSync(join(f.wt, '.beads')), false);
});

test('AC-2: worktree + server → rc=3 without live server, --db <main>/.beads/dolt with live server', t => {
  const f = fixture(t);
  f.mode('server'); f.dir('dolt');
  const dead = f.wrap(f.wt, ['ready']);
  assert.equal(dead.status, 3, dead.stdout + dead.stderr);
  assert.deepEqual(f.calls(), []);
  ok(f.wrap(f.wt, ['ready', '--json'], { BD_ENV_ASSUME_DOLT_ALIVE: '1' }));
  assert.deepEqual(f.calls(), [['--db', join(f.main, '.beads', 'dolt'), 'ready', '--json']]);
});

test('AC-3: fail-closed on missing/unreadable/invalid metadata, bad dolt_mode or missing database dir', async t => {
  const metaPath = 'metadata.json';
  const cases = [
    ['missing metadata.json', f => { f.dir('embeddeddolt'); }, metaPath],
    ['invalid JSON', f => { f.meta('{"dolt_mode": "embedded"'); f.dir('embeddeddolt'); }, metaPath],
    ['JSON is not an object', f => { f.meta('["embedded"]'); f.dir('embeddeddolt'); }, metaPath],
    ['dolt_mode absent', f => { f.meta('{"database":"dolt"}'); f.dir('embeddeddolt'); }, metaPath],
    ['dolt_mode empty', f => { f.mode(''); f.dir('embeddeddolt'); }, metaPath],
    ['dolt_mode not a string', f => { f.meta('{"dolt_mode": 1}'); f.dir('embeddeddolt'); }, metaPath],
    ['dolt_mode unknown', f => { f.mode('sqlite'); f.dir('embeddeddolt'); f.dir('dolt'); }, metaPath],
    ['embedded without database dir', f => { f.mode('embedded'); f.dir('dolt'); }, join('.beads', 'embeddeddolt')],
    ['server without database dir', f => { f.mode('server'); f.dir('embeddeddolt'); }, join('.beads', 'dolt')],
  ];
  if (process.getuid?.() !== 0) {
    cases.push(['unreadable metadata.json', f => {
      f.mode('embedded'); f.dir('embeddeddolt'); chmodSync(join(f.main, '.beads', 'metadata.json'), 0o000);
    }, metaPath]);
  }
  for (const [name, setup, pathPart] of cases) {
    await t.test(name, t2 => {
      const f = fixture(t2);
      setup(f);
      const result = f.wrap(f.wt, ['ready'], { BD_ENV_ASSUME_DOLT_ALIVE: '1' });
      assert.notEqual(result.status, 0, result.stdout + result.stderr);
      assert.ok(result.stderr.includes(join(f.main, '.beads')) && result.stderr.includes(pathPart),
        `stderr must name the path (${pathPart}): ${result.stderr}`);
      assert.deepEqual(f.calls(), [], 'bd must not be called');
      const direct = resolve(f);
      assert.equal(direct.status, 0, direct.stderr);
      assert.match(direct.stdout, /^1\|/, `resolver must fail closed: ${direct.stdout}`);
    });
  }
});

test('bd-env resolver: mode decides when both database dirs exist; key order and whitespace do not matter', t => {
  const f = fixture(t);
  f.dir('dolt'); f.dir('embeddeddolt');
  f.meta('{\n  "backend" : "dolt",\n\n  "extra": {"dolt_mode": "server"},\n  "dolt_mode"   :   "embedded"\n}\n');
  let direct = resolve(f);
  assert.equal(direct.stdout, `0|embedded|${join(f.main, '.beads', 'embeddeddolt')}`, direct.stderr);
  f.meta('{"dolt_mode":"server","database":"dolt"}');
  direct = resolve(f);
  // Сервер не запущен: режим и путь определены, код 3 — решение за вызывающим.
  assert.equal(direct.stdout, `3|server|${join(f.main, '.beads', 'dolt')}`, direct.stderr);
  ok(f.wrap(f.wt, ['list'], { BD_ENV_ASSUME_DOLT_ALIVE: '1' }));
  assert.deepEqual(f.calls(), [['--db', join(f.main, '.beads', 'dolt'), 'list']]);
});

test('edge: wrapper started from a subdirectory of the worktree', t => {
  const f = fixture(t);
  f.mode('embedded'); f.dir('embeddeddolt');
  ok(f.wrap(join(f.wt, 'sub'), ['show', 'ulab-oz6']));
  assert.deepEqual(f.calls(), [['--db', join(f.main, '.beads', 'embeddeddolt'), 'show', 'ulab-oz6']]);
});

test('AC-5: main checkout, allowed subcommand → exec bd with args unchanged, no --db', t => {
  const f = fixture(t);
  f.mode('embedded'); f.dir('embeddeddolt');
  const args = ['comment', 'ulab-oz6', 'текст с пробелами'];
  ok(f.wrap(f.main, args));
  assert.deepEqual(f.calls(), [args]);
});

// Три контекста: основной checkout, worktree embedded, worktree server (живой сервер).
function contexts(t) {
  const embedded = fixture(t);
  embedded.mode('embedded'); embedded.dir('embeddeddolt');
  const server = fixture(t);
  server.mode('server'); server.dir('dolt');
  return [
    ['main checkout (embedded)', embedded, embedded.main, {}, []],
    ['main checkout (server)', server, server.main, {}, []],
    ['worktree embedded', embedded, embedded.wt, {}, ['--db', join(embedded.main, '.beads', 'embeddeddolt')]],
    ['worktree server', server, server.wt, { BD_ENV_ASSUME_DOLT_ALIVE: '1' }, ['--db', join(server.main, '.beads', 'dolt')]],
  ];
}

test('AC-4: every allowlisted subcommand passes in main checkout and worktree, both modes', t => {
  for (const [name, f, cwd, extra, prefix] of contexts(t)) {
    for (const sub of ALLOWED) {
      f.reset();
      const args = ['--json', sub, 'arg'];
      const result = f.wrap(cwd, args, extra);
      assert.equal(result.status, 0, `${name} ${sub}: ${result.stdout}${result.stderr}`);
      assert.deepEqual(f.calls(), [[...prefix, ...args]], `${name} ${sub}`);
    }
  }
});

test('AC-4: forbidden subcommands, empty subcommand and forbidden flags in any position → rc=2, bd not called', t => {
  for (const [name, f, cwd, extra] of contexts(t)) {
    const cases = [...FORBIDDEN_SUBCOMMANDS.map(sub => [sub]), ...FORBIDDEN_SUBCOMMANDS.map(sub => ['--json', sub, 'x']),
      ...FORBIDDEN_ARGS];
    for (const args of cases) {
      f.reset();
      const result = f.wrap(cwd, args, extra);
      assert.equal(result.status, 2, `${name} [${args.join(' ')}]: ${result.stdout}${result.stderr}`);
      assert.deepEqual(f.calls(), [], `${name} [${args.join(' ')}]: bd must not be called`);
    }
    for (const sub of ['export', 'import', 'dolt']) {
      const result = f.wrap(cwd, [sub], extra);
      assert.match(result.stderr, /bd-sync-export\.sh/, `${name} ${sub}: sync hint preserved`);
    }
  }
});

// AC-12: флаги чтения локального файла — содержимое чужого файла не должно попасть в базу.
const FILE_FLAG_ARGS = [
  ['create', 'x', '--body-file', '/etc/hosts'],
  ['create', 'x', '--body-file=/etc/hosts'],
  ['update', 'ulab-1', '--design-file', '/etc/hosts'],
  ['update', 'ulab-1', '--design-file=/etc/hosts'],
  ['close', 'ulab-1', '--reason-file', '/etc/hosts'],
  ['close', 'ulab-1', '--reason-file=/etc/hosts'],
  ['create', '--file', '/etc/hosts'],
  ['create', '--file=/etc/hosts'],
  ['create', '--graph', '/etc/hosts'],
  ['create', '--graph=/etc/hosts'],
  ['create', '-f', '/etc/hosts'],
  ['create', '-f/etc/hosts'],
  ['create', '-qf', '/etc/hosts'],
  ['--json', 'comment', 'ulab-1', '-f', '/etc/hosts'],
  ['create', 'x', '--metadata', '@/etc/hosts'],
  ['create', 'x', '--metadata=@/etc/hosts'],
  ['update', 'ulab-1', '--metadata', '@x'],
];
const FILE_FLAG_ALLOWED = [
  ['create', 'x', '--metadata', '{"k":"v"}'],
  ['create', 'x', '--metadata={"k":"v"}'],
  ['create', 'x', '--stdin'],
  ['create', 'x', '--description', 'длинный текст'],
  ['comment', 'ulab-1', '--stdin'],
];

test('AC-12: file-reading flags in any position → rc=2, bd not called; --stdin/--description/--metadata JSON pass', t => {
  for (const [name, f, cwd, extra, prefix] of contexts(t)) {
    for (const args of FILE_FLAG_ARGS) {
      f.reset();
      const result = f.wrap(cwd, args, extra);
      assert.equal(result.status, 2, `${name} [${args.join(' ')}]: ${result.stdout}${result.stderr}`);
      assert.deepEqual(f.calls(), [], `${name} [${args.join(' ')}]: bd must not be called`);
    }
    for (const args of FILE_FLAG_ALLOWED) {
      f.reset();
      const result = f.wrap(cwd, args, extra);
      assert.equal(result.status, 0, `${name} [${args.join(' ')}]: ${result.stdout}${result.stderr}`);
      assert.deepEqual(f.calls(), [[...prefix, ...args]], `${name} [${args.join(' ')}]`);
    }
  }
});

test('AC-13: non-empty BEADS_DIR or BEADS_DB → rc=2, bd not called; empty values keep previous behaviour', t => {
  for (const [name, f, cwd, extra, prefix] of contexts(t)) {
    for (const variable of ['BEADS_DIR', 'BEADS_DB']) {
      f.reset();
      const result = f.wrap(cwd, ['ready'], { ...extra, [variable]: join(f.base, 'other', '.beads') });
      assert.equal(result.status, 2, `${name} ${variable}: ${result.stdout}${result.stderr}`);
      assert.ok(result.stderr.includes(variable), `${name} ${variable}: ${result.stderr}`);
      assert.deepEqual(f.calls(), [], `${name} ${variable}: bd must not be called`);
    }
    f.reset();
    ok(f.wrap(cwd, ['ready'], { ...extra, BEADS_DIR: '', BEADS_DB: '' }));
    assert.deepEqual(f.calls(), [[...prefix, 'ready']], `${name}: empty BEADS_* pass`);
  }
});

// Фикстура applier: origin с веткой beads-backup и снимком, заглушка `bd` в PATH,
// BD_BIN не задан — значит шаг 4 выполняется (как у оператора).
function applierFixture(t, mode, dirs) {
  const f = fixture(t);
  if (mode) f.mode(mode);
  for (const dir of dirs) f.dir(dir);
  const rows = [{ id: 'ulab-oz6', title: 'Fixture', status: 'open', priority: 1, issue_type: 'task', notes: '', dependencies: [] }];
  const snapshot = rows.map(row => JSON.stringify(row)).join('\n') + '\n';
  const origin = join(f.base, 'origin.git');
  git(f.base, 'init', '-q', '--bare', origin);
  git(f.main, 'remote', 'add', 'origin', origin);
  git(f.main, 'switch', '-q', '-c', 'beads-backup');
  writeFileSync(join(f.main, '.beads', 'issues.jsonl'), snapshot);
  git(f.main, 'add', '.beads/issues.jsonl');
  git(f.main, 'commit', '-q', '-m', 'snapshot');
  git(f.main, 'push', '-q', 'origin', 'beads-backup');
  git(f.main, 'switch', '-q', 'main');
  const exported = join(f.base, 'export.jsonl');
  writeFileSync(exported, snapshot);
  const queue = join(f.base, 'queue.jsonl');
  writeFileSync(queue, JSON.stringify({ intent_id: 'local-1', op: 'note', ref: 'ulab-oz6', text: 'fixture' }) + '\n');
  f.apply = () => spawnSync(BASH, [applier, '--dry-run', queue], {
    cwd: f.main, encoding: 'utf8', timeout: 30000,
    env: cleanEnv({ PATH: `${f.bin}:${process.env.PATH}`, BD_LOCAL_STUB_LOG: f.log, BD_LOCAL_STUB_EXPORT: exported }),
  });
  return f;
}

test('AC-11: applier step 4, embedded with database dir → proceeds to step 5 and the engine', t => {
  const f = applierFixture(t, 'embedded', ['embeddeddolt']);
  const result = f.apply();
  ok(result);
  const calls = f.calls();
  assert.equal(calls.length, 1, JSON.stringify(calls));
  assert.deepEqual(calls[0].slice(0, 3), ['export', '--all', '-o']);
});

test('AC-11: applier step 4, embedded without database dir → refusal naming the path, bd not called', t => {
  const f = applierFixture(t, 'embedded', ['dolt']);
  const result = f.apply();
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.ok(result.stderr.includes(join(f.main, '.beads', 'embeddeddolt')), result.stderr);
  assert.deepEqual(f.calls(), []);
});

test('AC-11: applier step 4, server without live server → exit 3 as before, bd not called', t => {
  const f = applierFixture(t, 'server', ['dolt']);
  const result = f.apply();
  assert.equal(result.status, 3, result.stdout + result.stderr);
  assert.match(result.stderr, /dolt-сервер основного checkout не запущен/);
  assert.deepEqual(f.calls(), []);
});

test('AC-7: settings.json allows only the wrapper and the reader, deny for bd is kept', () => {
  const settings = JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
  const allow = settings.permissions.allow;
  for (const rule of ['Bash(scripts/bd-wt.sh *)', 'Bash(bash scripts/bd-wt.sh *)',
    'Bash(scripts/bd-read.sh *)', 'Bash(bash scripts/bd-read.sh *)']) {
    assert.equal(allow.filter(item => item === rule).length, 1, rule);
  }
  assert.deepEqual(allow.filter(item => /\bbd\b|bd-sync|bd-apply/.test(item)).length, 4);
  for (const rule of ['Bash(bd delete*)', 'Bash(bd dolt push*)', 'Bash(bd dolt pull*)', 'Bash(*BD_SYNC_FORCE*)']) {
    assert.ok(settings.permissions.deny.includes(rule), rule);
  }
});

function blob(path) {
  const body = readFileSync(join(root, path));
  return createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex');
}
function sha256(path) { return createHash('sha256').update(readFileSync(join(root, path))).digest('hex'); }

test('AC-10: drift record and applier provenance match the current files', () => {
  const drift = JSON.parse(readFileSync(join(root, 'docs/verification/beads-wrapper-drift.json'), 'utf8'));
  const plan = JSON.parse(readFileSync(join(root, 'docs/verification/overgate-install-plan.json'), 'utf8'));
  const paths = drift.files.map(entry => entry.path).sort();
  assert.deepEqual(paths, ['scripts/bd-wt.sh', 'scripts/lib/bd-env.sh']);
  for (const entry of drift.files) {
    const planned = plan.operations.find(item => item.target === entry.path);
    assert.ok(planned, entry.path);
    assert.equal(entry.manifest_sha256, planned.after.sha256, entry.path);
    assert.match(entry.manifest_git_blob_sha1, /^[0-9a-f]{40}$/);
    assert.equal(entry.target_git_blob_sha1, blob(entry.path), entry.path);
    assert.equal(entry.target_sha256, sha256(entry.path), entry.path);
    assert.ok(entry.reason && entry.upstream, entry.path);
  }
  const provenance = JSON.parse(readFileSync(join(root, 'docs/verification/cloud-tooling-provenance.json'), 'utf8'));
  const apply = provenance.files.find(entry => entry.path === 'scripts/bd-apply-intents.sh');
  assert.equal(apply.target_git_blob_sha1, blob('scripts/bd-apply-intents.sh'));
  assert.equal(apply.target_sha256, sha256('scripts/bd-apply-intents.sh'));
});

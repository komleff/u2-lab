import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
const engine = join(root, 'scripts/lib/bd-apply-engine.mjs');
const original = [{ id: 'ulab-9aa.1', title: 'Bootstrap', status: 'blocked', priority: 1, issue_type: 'task', notes: '', dependencies: [] }];
const jsonl = rows => rows.map(row => JSON.stringify(row)).join('\n') + '\n';
const note = { intent_id: 'note-1', op: 'note', ref: 'ulab-9aa.1', text: 'Pending cloud evidence' };
const create = { intent_id: 'create-1', op: 'create', handle: 'tmp:new', title: 'Fixture only', priority: 2 };

// Только изолированный stub: реальный bd не находится и не вызывается.
const stubCode = `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(process.env.CLOUD_STUB_STATE, 'utf8'));
fs.appendFileSync(process.env.CLOUD_STUB_LOG, JSON.stringify(args) + '\\n');
const value = name => args.find(a => a.startsWith(name + '='))?.slice(name.length + 1);
const issue = state.find(row => row.id === args[1]);
switch (args[0]) {
  case 'create': {
    const id = 'ulab-fixture';
    state.push({ id, title: value('--title'), status: 'open', priority: value('--priority'), issue_type: value('--type'), external_ref: value('--external-ref'), notes: '', dependencies: [] });
    process.stdout.write(id + '\\n'); break;
  }
  case 'note': issue.notes += fs.readFileSync(0, 'utf8'); break;
  case 'close': issue.status = 'closed'; break;
  case 'update':
    for (const [flag, key] of [['--status', 'status'], ['--priority', 'priority'], ['--assignee', 'assignee'], ['--type', 'issue_type']]) {
      if (value(flag) !== undefined) issue[key] = value(flag);
    }
    break;
  case 'dep': state.find(row => row.id === args[2]).dependencies.push({ depends_on_id: value('--blocked-by'), type: value('--type') || 'blocks' }); break;
  default: throw new Error('Unexpected stub command: ' + args);
}
fs.writeFileSync(process.env.CLOUD_STUB_STATE, JSON.stringify(state));
`;

function fixture(t, rows, live = original) {
  assert.ok(existsSync(engine), 'project cloud engine must be installed');
  const dir = mkdtempSync(join(tmpdir(), 'ulab-cloud-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const paths = Object.fromEntries(['queue', 'index', 'remote', 'receipt', 'summary', 'state', 'log', 'stub'].map(key => [key, join(dir, key)]));
  writeFileSync(paths.queue, jsonl(rows));
  writeFileSync(paths.index, jsonl(live));
  writeFileSync(paths.remote, jsonl(live));
  writeFileSync(paths.state, JSON.stringify(live));
  writeFileSync(paths.log, '');
  writeFileSync(paths.stub, stubCode); chmodSync(paths.stub, 0o700);
  return {
    paths,
    calls: () => readFileSync(paths.log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse),
    state: () => JSON.parse(readFileSync(paths.state, 'utf8')),
    run: (dry = false) => spawnSync(process.execPath, [engine, '--queue', paths.queue, '--index', paths.index, '--remote', paths.remote, '--receipt', paths.receipt, '--summary-file', paths.summary, '--bd', paths.stub, ...(dry ? ['--dry-run'] : [])], {
      encoding: 'utf8', timeout: 8000,
      env: { ...process.env, CLOUD_STUB_STATE: paths.state, CLOUD_STUB_LOG: paths.log },
    }),
  };
}
function success(result) { assert.equal(result.status, 0, result.stdout + result.stderr); }
function reject(f, diagnostic) {
  const result = f.run();
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, diagnostic);
  assert.deepEqual(f.calls(), [], 'whole queue must reject before any bd call');
  assert.equal(existsSync(f.paths.receipt), false);
  assert.equal(existsSync(f.paths.summary), false);
}

test('offline notes dry-run accepts real hierarchical ulab IDs without bd or writes', t => {
  const f = fixture(t, [note]); const before = readFileSync(f.paths.index, 'utf8');
  success(f.run(true));
  assert.deepEqual(f.calls(), []);
  assert.equal(existsSync(f.paths.receipt), false);
  assert.equal(readFileSync(f.paths.index, 'utf8'), before);
  assert.equal(JSON.parse(readFileSync(f.paths.summary)).counts.note, 1);
});

test('ordered handles support all operations in an offline dry-run', t => {
  const f = fixture(t, [create,
    { intent_id: 'dep-1', op: 'dep_add', ref: 'tmp:new', blocked_by: 'ulab-9aa.1' },
    { intent_id: 'update-1', op: 'update', ref: 'tmp:new', status: 'in_progress' },
    { intent_id: 'comment-1', op: 'comment', ref: 'tmp:new', text: 'Fixture comment' },
    { intent_id: 'close-1', op: 'close', ref: 'tmp:new', close_reason: 'Fixture done' },
  ]);
  success(f.run(true)); assert.deepEqual(f.calls(), []);
  assert.equal(JSON.parse(readFileSync(f.paths.summary)).mutations, 5);
});

const invalid = [
  ['unknown operation', { ...note, op: 'delete' }, /неизвестный op/],
  ['unknown field', { ...note, surprise: true }, /лишний ключ/],
  ['missing real ref', { ...note, ref: 'ulab-absent' }, /не найден/],
  ['foreign prefix', { ...note, ref: 'U2-9aa' }, /некорректный ref/],
  ['unsafe ref', { ...note, ref: '../ulab-9aa.1' }, /некорректный ref/],
  ['priority outside range', { intent_id: 'bad', op: 'update', ref: note.ref, priority: 5 }, /priority вне/],
  ['invalid status', { intent_id: 'bad', op: 'update', ref: note.ref, status: 'done' }, /неизвестный status/],
  ['invalid type', { ...create, intent_id: 'bad', handle: 'tmp:bad', type: 'invalid' }, /неизвестный type/],
  ['invalid dependency type', { intent_id: 'bad', op: 'dep_add', ref: note.ref, blocked_by: note.ref, dep_type: 'invalid' }, /неизвестный dep_type/],
  ['non-string text', { ...note, text: 7 }, /должно быть строкой/],
  ['NUL in text', { ...note, text: 'bad\0text' }, /управляющий символ/],
  ['reserved marker injection', { ...note, text: '[intent:spoof]' }, /зарезервированную/],
  ['oversized text', { ...note, text: 'x'.repeat(8001) }, /длиннее/],
  ['invalid handle', { ...create, intent_id: 'bad', handle: 'tmp:../bad' }, /handle должен/],
];
for (const [name, row, diagnostic] of invalid) test(`mixed queue rejects ${name} with zero mutations`, t => {
  reject(fixture(t, [create, row]), diagnostic);
});
test('forward reference rejects entire queue', t => reject(fixture(t, [{ ...note, ref: 'tmp:new' }, create]), /необъявленный хэндл/));
test('duplicate intent IDs reject entire queue', t => reject(fixture(t, [create, note, note]), /дубль intent_id/));
test('duplicate handles reject entire queue', t => reject(fixture(t, [create, { ...create, intent_id: 'create-2' }]), /повторный хэндл/));
test('malformed queue rejects earlier valid create', t => {
  const f = fixture(t, [create]); writeFileSync(f.paths.queue, jsonl([create]) + '{broken\n');
  reject(f, /невалидный JSON/);
});
test('full-content remote divergence blocks before bd even without timestamp changes', t => {
  const f = fixture(t, [note]); writeFileSync(f.paths.remote, jsonl([{ ...original[0], notes: 'remote-only' }]));
  reject(f, /расходится/);
});
for (const key of ['index', 'remote']) test(`corrupt ${key} snapshot blocks before bd`, t => {
  const f = fixture(t, [note]); writeFileSync(f.paths[key], jsonl(original) + '{broken\n');
  reject(f, /снимок повреждён/);
});
test('source markers survive receipt loss: repeat create/note/dep/update/close causes zero duplicate mutations', t => {
  const rows = [create, { ...note, ref: 'tmp:new' },
    { intent_id: 'dep-1', op: 'dep_add', ref: 'tmp:new', blocked_by: note.ref },
    { intent_id: 'update-1', op: 'update', ref: 'tmp:new', priority: 3 },
    { intent_id: 'close-1', op: 'close', ref: 'tmp:new', close_reason: 'Done' }];
  const f = fixture(t, rows); success(f.run());
  assert.deepEqual(f.calls().map(call => call[0]), ['create', 'note', 'dep', 'update', 'close']);
  assert.equal(f.state().length, 2);
  assert.equal(f.state()[1].notes.match(/\[intent:note-1\]/g).length, 1);
  rmSync(f.paths.receipt); writeFileSync(f.paths.index, jsonl(f.state())); writeFileSync(f.paths.remote, jsonl(f.state()));
  const count = f.calls().length; success(f.run());
  assert.equal(f.calls().length, count);
  assert.equal(JSON.parse(readFileSync(f.paths.summary)).mutations, 0);
  assert.equal(JSON.parse(readFileSync(f.paths.receipt)).handles['tmp:new'], 'ulab-fixture');
});
test('note marker prefix cannot falsely skip a distinct intent', t => {
  const f = fixture(t, [{ ...note, intent_id: 'ab' }], [{ ...original[0], notes: '[intent:abc]' }]);
  success(f.run()); assert.equal(f.calls().length, 1);
  assert.match(f.state()[0].notes, /\[intent:ab\]/);
});
test('bootstrap pending queue only notes original IDs and dry-runs without bd', t => {
  const checkpoint = readFileSync(join(root, 'docs/verification/beads-prepared-checkpoint.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  const queue = readFileSync(join(root, '.bd-intents/bootstrap-cloud.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.ok(queue.length >= 2);
  for (const row of queue) {
    assert.equal(row.op, 'note'); assert.ok(checkpoint.some(issue => issue.id === row.ref));
    assert.match(row.text, /PENDING|pending/);
  }
  const f = fixture(t, queue, checkpoint); success(f.run(true)); assert.deepEqual(f.calls(), []);
});

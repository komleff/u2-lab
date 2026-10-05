import { execFileSync } from 'node:child_process';
import { it, expect } from 'vitest';
it('IP18/P10 measures retained memory for 98 channels and preserves 64-channel 50000-bucket capacity', () => {
  for (const channels of [98, 64]) {
    const output = execFileSync(process.execPath, ['--expose-gc', 'tests/retention-memory.mjs', String(channels)], {encoding: 'utf8', timeout: 20000});
    const row = JSON.parse(output.split('\n').find(line => line.startsWith('{"channels":'))!);
    expect(row.actualBytes).toBeLessThanOrEqual(128 * 1048576);
    expect(row.totalTicks).toBe(50000);
  }
}, 45000);

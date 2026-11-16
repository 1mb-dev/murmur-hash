import { test } from 'node:test';
import assert from 'node:assert';
import {
  hash128,
  hash128x64,
  createHash128,
  createHash128x64,
  type HashOutput,
} from '../src/index.ts';

// Compile-time checks run by `npm run lint` (tsconfig.test.json); the runtime test keeps them honest.
test('types: output option selects string or bigint', () => {
  const output: HashOutput = 'bigint';

  const hex: string[] = [
    hash128('x'),
    hash128('x', { seed: 1 }),
    hash128('x', { output: 'hex' }),
    hash128x64('x'),
    hash128x64('x', { seed: 1, output: 'hex' }),
    createHash128().update('x').digest(),
    createHash128x64({ seed: 1 }).update('x').digest(),
  ];
  const big: bigint[] = [
    hash128('x', { output: 'bigint' }),
    hash128x64('x', { seed: 1, output: 'bigint' }),
    createHash128({ output: 'bigint' }).update('x').digest(),
    createHash128x64({ output: 'bigint' }).update('x').digest(),
  ];
  const either: Array<string | bigint> = [
    hash128('x', { output }),
    hash128x64('x', { output }),
    createHash128({ output }).digest(),
  ];

  // @ts-expect-error bigint output is not a string
  const wrong: string = hash128('x', { output: 'bigint' });

  assert.ok(hex.every((h) => typeof h === 'string'));
  assert.ok(big.every((b) => typeof b === 'bigint'));
  assert.ok(either.every((v) => typeof v === 'bigint'));
  assert.strictEqual(typeof wrong, 'bigint');
});

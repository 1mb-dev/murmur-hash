import { test } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { hash32, hash128, hash128x64 } from '../src/index.ts';

const variants = [
  ['hash32', (x: unknown) => hash32(x as Uint8Array, 7)],
  ['hash128', (x: unknown) => hash128(x as Uint8Array, { seed: 7 })],
  ['hash128x64', (x: unknown) => hash128x64(x as Uint8Array, { seed: 7 })],
] as const;

function assertSameHash(input: unknown, bytes: Uint8Array, what: string): void {
  for (const [name, fn] of variants) {
    assert.strictEqual(fn(input), fn(bytes), `${name}: ${what}`);
  }
}

test('input: Uint8Array from another realm hashes its bytes', () => {
  const foreign = vm.runInNewContext('new Uint8Array([1, 2, 3, 200])');
  assert.ok(!(foreign instanceof Uint8Array));
  assertSameHash(foreign, new Uint8Array([1, 2, 3, 200]), 'cross-realm Uint8Array');
});

test('input: ArrayBuffer hashes its bytes, from this realm or another', () => {
  const bytes = new Uint8Array([9, 8, 7, 6, 5]);
  assertSameHash(bytes.slice().buffer, bytes, 'ArrayBuffer');
  const foreign = vm.runInNewContext('new Uint8Array([9, 8, 7, 6, 5]).buffer');
  assert.ok(!(foreign instanceof ArrayBuffer));
  assertSameHash(foreign, bytes, 'cross-realm ArrayBuffer');
  const shared = new SharedArrayBuffer(5);
  new Uint8Array(shared).set(bytes);
  assertSameHash(shared, bytes, 'SharedArrayBuffer');
});

test('input: other typed array views hash their bytes, honoring byteOffset', () => {
  const buf = new ArrayBuffer(12);
  new Uint8Array(buf).set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  const u16 = new Uint16Array(buf, 2, 3);
  assertSameHash(u16, new Uint8Array(buf, 2, 6), 'Uint16Array at offset 2');

  const dv = new DataView(buf, 3, 5);
  assertSameHash(dv, new Uint8Array(buf, 3, 5), 'DataView at offset 3');

  const sub = new Uint8Array(buf).subarray(4, 9);
  assertSameHash(sub, Uint8Array.of(5, 6, 7, 8, 9), 'Uint8Array subarray');
});

test('input: Buffer hashes like the same bytes and the same string', () => {
  const buf = Buffer.from('héllo');
  assertSameHash(buf, new TextEncoder().encode('héllo'), 'Buffer');
  assert.strictEqual(hash32(buf), hash32('héllo'));
});

// Warnings are once per process, so each case runs in its own child.
const root = fileURLToPath(new URL('..', import.meta.url));

function runChild(body: string): { warnings: Array<{ code: string; message: string }>; out: unknown } {
  const code = `
    import { hash32, hash128, hash128x64, createHash128, createHash128x64 } from './src/index.ts';
    const warnings = [];
    process.on('warning', (w) => {
      if (String(w.code).startsWith('MURMUR_HASH_')) warnings.push({ code: w.code, message: w.message });
    });
    const out = (() => { ${body} })();
    process.on('exit', () => console.log(JSON.stringify({ warnings, out })));
  `;
  const r = spawnSync(
    process.execPath,
    ['--no-warnings', '--import', 'tsx', '--input-type=module', '-e', code],
    { cwd: root, encoding: 'utf8' }
  );
  assert.strictEqual(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop()!);
}

const badInputs: Array<[string, string, string]> = [
  ['null', 'null', "'null'"],
  ['undefined', 'undefined', "''"],
  ['42', '42', "'42'"],
];

for (const [label, expr, asString] of badInputs) {
  test(`input: ${label} warns once and hashes as today`, () => {
    const { warnings, out } = runChild(`
      const x = ${expr};
      return [
        hash32(x) === hash32(${asString}),
        hash32(x, 3) === hash32(${asString}, 3),
        hash128(x) === hash128(${asString}),
        hash128x64(x) === hash128x64(${asString}),
      ];
    `);
    assert.deepStrictEqual(out, [true, true, true, true]);
    assert.strictEqual(warnings.length, 1, JSON.stringify(warnings));
    assert.strictEqual(warnings[0].code, 'MURMUR_HASH_INPUT');
  });
}

const badOptions: Array<[string, string, string]> = [
  ["hash128('x', 42)", "hash128('x', 42)", "hash128('x')"],
  ["hash128x64('x', 42)", "hash128x64('x', 42)", "hash128x64('x')"],
  ['createHash128(42)', "createHash128(42).update('x').digest()", "hash128('x')"],
  ['createHash128x64(42)', "createHash128x64(42).update('x').digest()", "hash128x64('x')"],
];

for (const [label, call, unseeded] of badOptions) {
  test(`options: ${label} warns once and keeps seed 0`, () => {
    const { warnings, out } = runChild(`
      const a = ${call};
      const b = ${call};
      return a === ${unseeded} && b === a;
    `);
    assert.strictEqual(out, true);
    assert.strictEqual(warnings.length, 1, JSON.stringify(warnings));
    assert.strictEqual(warnings[0].code, 'MURMUR_HASH_OPTIONS');
    assert.match(warnings[0].message, /\{ seed: 42 \}/);
  });
}

test('valid input and options emit no warning', () => {
  const { warnings } = runChild(`
    hash32('a'); hash32(new Uint8Array(2), 5); hash32(new ArrayBuffer(3));
    hash128('a'); hash128('a', undefined); hash128('a', null); hash128('a', { seed: 1, output: 'bigint' });
    hash128x64(Buffer.from('a'), {}); createHash128().update('a').digest(); createHash128x64({ seed: 2 }).digest();
  `);
  assert.deepStrictEqual(warnings, []);
});

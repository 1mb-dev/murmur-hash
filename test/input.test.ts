import { test } from 'node:test';
import assert from 'node:assert';
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

import { test } from 'node:test';
import assert from 'node:assert';
import { hash32, hash128, hash128x64 } from '../src/index.ts';

// SMHasher's VerificationTest: hash keys {0}, {0,1}, ... of length 0..255 with seed 256 - len,
// concatenate the digests as the C++ reference writes them (each word little-endian), hash that
// with seed 0 and read the first 4 bytes little-endian.

function fromHex(hex: string, wordDigits: number): number[] {
  const out: number[] = [];
  for (const word of hex.match(new RegExp(`.{${wordDigits}}`, 'g'))!) {
    out.push(...word.match(/../g)!.reverse().map((b) => parseInt(b, 16)));
  }
  return out;
}

function verification(digest: (key: Uint8Array, seed: number) => number[]): number {
  const all: number[] = [];
  for (let len = 0; len < 256; len++) {
    const key = Uint8Array.from({ length: len }, (_, i) => i);
    all.push(...digest(key, 256 - len));
  }
  const final = digest(Uint8Array.from(all), 0);
  return (final[0] | (final[1] << 8) | (final[2] << 16) | (final[3] << 24)) >>> 0;
}

test('SMHasher verification: x86 32-bit', () => {
  const v = verification((key, seed) => fromHex(hash32(key, seed).toString(16).padStart(8, '0'), 8));
  assert.strictEqual(v, 0xb0f57ee3);
});

test('SMHasher verification: x86 128-bit', () => {
  const v = verification((key, seed) => fromHex(hash128(key, { seed }), 8));
  assert.strictEqual(v, 0xb3ece62a);
});

test('SMHasher verification: x64 128-bit', () => {
  const v = verification((key, seed) => fromHex(hash128x64(key, { seed }), 16));
  assert.strictEqual(v, 0x6384ba69);
});

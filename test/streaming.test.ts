import { test } from 'node:test';
import assert from 'node:assert';
import {
  hash32,
  hash128,
  hash128x64,
  createHash32,
  createHash128,
  createHash128x64,
} from '../src/index.ts';

const data = Uint8Array.from({ length: 40 }, (_, i) => (i * 73 + 11) & 0xff);
const empty = new Uint8Array(0);

const variants = [
  ['hash32', (b: Uint8Array) => hash32(b, 9), () => createHash32(9)],
  ['hash128', (b: Uint8Array) => hash128(b, { seed: 9 }), () => createHash128({ seed: 9 })],
  ['hash128x64', (b: Uint8Array) => hash128x64(b, { seed: 9 }), () => createHash128x64({ seed: 9 })],
] as const;

for (const [name, oneShot, create] of variants) {
  test(`${name} stream: every split of lengths 0-40 matches one-shot`, () => {
    for (let len = 0; len <= data.length; len++) {
      const input = data.subarray(0, len);
      const expected = oneShot(input);
      for (let at = 0; at <= len; at++) {
        const h = create();
        h.update(empty).update(input.subarray(0, at)).update(empty).update(input.subarray(at));
        assert.strictEqual(h.digest(), expected, `len=${len} split=${at}`);
        assert.strictEqual(h.digest(), expected, `len=${len} split=${at}, second digest`);
      }
    }
  });
}

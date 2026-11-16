# murmur-hash

MurmurHash3 for JavaScript: x86 32-bit, x86 128-bit and x64 128-bit. Output matches the C++ reference and Python `mmh3`.

> **Note:** MurmurHash is non-cryptographic. Do not use for passwords, security tokens, or other sensitive data.

[![npm version](https://img.shields.io/npm/v/murmur-hash.svg)](https://www.npmjs.com/package/murmur-hash)
[![CI](https://github.com/1mb-dev/murmur-hash/actions/workflows/ci.yml/badge.svg)](https://github.com/1mb-dev/murmur-hash/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- All three MurmurHash3 variants in one package
- Strings hashed as UTF-8; bytes hashed as given (`Uint8Array`, `Buffer`, `ArrayBuffer`, any typed array or `DataView`)
- 128-bit output as hex or `bigint`
- ESM and CommonJS, TypeScript types included
- Zero dependencies

## Installation

```bash
npm install murmur-hash
```

## Quick Start

```js
import { hash32, hash128, hash128x64 } from 'murmur-hash';

hash32('hello');       // 613153351
hash128('hello');      // '2b2444a0db91def79adb31b69adb31b6'
hash128x64('hello');   // 'cbd8a7b341bd9b025b1e906a48ae1d19'
```

## Compatibility

Every variant is tested against Python `mmh3` 5.3.1 across all tail lengths, seeds up to `0xffffffff`, non-ASCII strings and arbitrary bytes. `hash32` returns the same number:

```
$ python -c "import mmh3; print(mmh3.hash('hello', signed=False))"
613153351
```

The 128-bit hex is each 32-bit word (x86: `h1 h2 h3 h4`) or 64-bit word (x64: `h1 h2`) printed most significant byte first. Byte-oriented outputs such as `mmh3.hash_bytes()` or the C++ reference's `out` buffer store each word little-endian, so their hex has the bytes of every word reversed. To compare:

```js
// x86: words of 8 hex digits; x64: words of 16
const toLittleEndian = (hex, digits) =>
  hex.match(new RegExp(`.{${digits}}`, 'g'))
    .map((w) => w.match(/../g).reverse().join(''))
    .join('');

toLittleEndian(hash128('hello'), 8);       // 'a044242bf7de91dbb631db9ab631db9a' = mmh3.hash_bytes('hello', x64arch=False).hex()
toLittleEndian(hash128x64('hello'), 16);   // '029bbd41b3a7d8cb191dae486a901e5b' = mmh3.hash_bytes('hello').hex()
```

The `bigint` output is `BigInt('0x' + hex)`, so `h1` is the most significant word. `mmh3.hash128()` builds its integer from the little-endian bytes, so its `h1` is the least significant word.

## API

### Input

- **Strings** are hashed as their UTF-8 bytes.
- **Bytes** are hashed as given: `Uint8Array` (including `Buffer`), `ArrayBuffer`, `SharedArrayBuffer`, any typed array or `DataView` (only the bytes the view covers), including values from another realm such as `vm` or a Jest environment.
- **Anything else** is hashed as `String(value)` (`undefined` as `''`) and emits a one-time process warning. A future major version will throw.
- **Seeds** are taken modulo 2^32, so `-1` and `0xffffffff` are the same seed.

### hash32(input, seed?)

Returns a 32-bit unsigned integer. The seed is positional.

```js
hash32('hello')                   // 613153351
hash32('hello', 42)               // 3806057185
hash32(new Uint8Array([1, 2, 3])) // 2161234436
```

### hash128(input, options?)

Returns the x86 128-bit hash as a hex string or `bigint`. The seed goes in the options object: `hash128('hello', 42)` ignores the number, uses seed 0 and emits a one-time warning.

```js
hash128('hello')                         // '2b2444a0db91def79adb31b69adb31b6'
hash128('hello', { seed: 42 })           // '9c4f9a01053404f6886f9b95886f9b95'
hash128('hello', { output: 'bigint' })   // 57345118453971251252955886550674780598n
```

### hash128x64(input, options?)

Returns the x64 128-bit hash as a hex string or `bigint`. Options as for `hash128`.

```js
hash128x64('hello')                         // 'cbd8a7b341bd9b025b1e906a48ae1d19'
hash128x64('hello', { seed: 42 })           // 'c4b8b3c960af6f082334b875b0efbc7a'
hash128x64('hello', { output: 'bigint' })   // 270958220630372089478071420295823891737n
```

### Incremental input

`createHash32(seed?)`, `createHash128(options?)` and `createHash128x64(options?)` return a hasher with `update(input)` and `digest()`. The result equals hashing the concatenated bytes in one call. Chunks are buffered and hashed at `digest()`, so memory grows with the input.

```js
import { createHash32 } from 'murmur-hash';

const hasher = createHash32();
hasher.update('hello');
hasher.update(' world');
hasher.digest();  // 1586663183, same as hash32('hello world')
```

## Types

```ts
type HashInput = string | Uint8Array | ArrayBuffer | ArrayBufferView;

interface Hash128Options {
  seed?: number;              // default: 0
  output?: 'hex' | 'bigint';  // default: 'hex'
}
```

## Performance

Benchmarks on Apple M1 (ops/sec):

```
hash32     short string    2,000,000+
hash32     1KB bytes         560,000
hash128    short string      540,000
hash128    1KB bytes         350,000
hash128x64 short string      530,000
hash128x64 1KB bytes          35,000
```

Run locally: `npm run bench`

## Migration from v1

**Non-ASCII strings hash differently.** 1.x hashed strings by UTF-16 code unit; 2.x hashes their UTF-8 bytes. ASCII-only strings give the same values in both. Re-hash stored values for keys with any non-ASCII character.

The 1.x `v3.x86.hash32`, `v3.x86.hash128` and `v3.x64.hash128` functions remain as deprecated aliases that log a deprecation warning:

```js
// v1 (deprecated)
import { v3 } from 'murmur-hash';
v3.x86.hash32('hello');

// v2
import { hash32 } from 'murmur-hash';
hash32('hello');
```

## Requirements

Node.js 22 or later. The code uses no Node-only APIs (it needs ES2020, `BigInt` and `TextEncoder`), but CI tests Node only.

## License

MIT

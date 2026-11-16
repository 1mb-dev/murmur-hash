# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-11-16

Upgrading from 1.x: non-ASCII strings hash differently since 2.0.0 (UTF-8, not UTF-16 code units). ASCII-only strings are unchanged.

### Changed
- Requires Node.js 22 or later (was 20).

### Fixed
- `ArrayBuffer`, `SharedArrayBuffer`, typed arrays, `DataView` and a `Uint8Array` from another realm (`vm`, Jest) hash their bytes; they hashed a string form before.
- README: `hash128('hello')` is `'2b2444a0db91def79adb31b69adb31b6'`.

### Added
- A one-time process warning for input that is neither a string nor bytes, and for a non-object options argument to `hash128`, `hash128x64`, `createHash128` and `createHash128x64` (a number there is ignored, seed 0).
- TypeScript: the 128-bit functions and hashers return `string` or `bigint` according to the `output` option.

## [2.0.1] - 2026-02-15

### Changed
- Repository moved to the 1mb-dev GitHub organization.

## [2.0.0] - 2025-11-19

### Added
- **TypeScript rewrite** - Full TypeScript source with type definitions
- **128-bit hash functions** - `hash128()` (x86) and `hash128x64()` (x64)
- **Streaming API** - `createHash32()`, `createHash128()`, `createHash128x64()`
- **BigInt output** - Option to return 128-bit hashes as BigInt
- **Uint8Array support** - Hash binary data directly
- **Dual format build** - ESM and CJS outputs
- **Benchmarks** - Performance testing with `npm run bench`

### Changed
- **Non-ASCII strings hash differently from 1.0.0** - Strings are hashed as UTF-8; 1.x hashed UTF-16 code units. ASCII-only strings are unchanged
- **Flat API** - Use `hash32()`, `hash128()`, `hash128x64()` directly
- **Zero dependencies** - Removed `debug` dependency
- **Modern target** - Requires Node.js 20+

### Deprecated
- **v3 API** - `v3.x86.hash32()` etc. still work but show deprecation warning

### Removed
- **Node.js < 20 support** - Now requires Node.js 20+

## [1.0.0] - 2015-02-01

### Added
- Initial release
- MurmurHash3 x86 32-bit and 128-bit
- MurmurHash3 x64 128-bit

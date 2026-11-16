import type { HashInput } from './types.ts';

const encoder = new TextEncoder();

const warned = new Set<string>();

function warnOnce(code: string, message: string): void {
  if (warned.has(code)) return;
  warned.add(code);
  if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
    process.emitWarning(message, { code });
  }
}

function describe(value: unknown): string {
  return value === null ? 'null' : typeof value;
}

/**
 * Convert input to the bytes that get hashed: strings as UTF-8, binary input as-is.
 * Tag and isView checks, not instanceof, so values from another realm (vm, Jest) work.
 */
export function toBytes(input: HashInput): Uint8Array {
  if (typeof input === 'string') {
    return encoder.encode(input);
  }
  if (input instanceof Uint8Array) {
    return input;
  }
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  const tag = Object.prototype.toString.call(input);
  if (tag === '[object ArrayBuffer]' || tag === '[object SharedArrayBuffer]') {
    return new Uint8Array(input as ArrayBuffer);
  }
  warnOnce(
    'MURMUR_HASH_INPUT',
    `murmur-hash: expected a string, Uint8Array, ArrayBuffer or typed array view, got ${describe(input)}. ` +
      `It is hashed as String(value), or '' for undefined; pass that string yourself to keep the hash. ` +
      `A future major version will throw.`
  );
  return encoder.encode(input as unknown as string);
}

/**
 * Warn when the 128-bit options argument is not an object. A number there is
 * ignored (seed 0); hash32 is the only call that takes a positional seed.
 */
export function checkOptions(options: unknown, fn: string): void {
  if (options == null || typeof options === 'object') return;
  const example = typeof options === 'number' ? `{ seed: ${options} }` : '{ seed: 42 }';
  warnOnce(
    'MURMUR_HASH_OPTIONS',
    `murmur-hash: ${fn} takes an options object, got ${describe(options)}, which is ignored and the seed is 0. ` +
      `Pass ${example} to seed it, or drop the argument to keep the hash; only hash32 takes a positional seed.`
  );
}

/**
 * Convert hex string to BigInt
 */
export function hexToBigInt(hex: string): bigint {
  return BigInt('0x' + hex);
}

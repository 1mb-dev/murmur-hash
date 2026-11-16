import type { HashInput } from './types.ts';

const encoder = new TextEncoder();

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
  return encoder.encode(input as unknown as string);
}

/**
 * Convert hex string to BigInt
 */
export function hexToBigInt(hex: string): bigint {
  return BigInt('0x' + hex);
}

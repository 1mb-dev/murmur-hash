/**
 * Output format for 128-bit hash functions
 */
export type HashOutput = 'hex' | 'bigint';

/**
 * Options for 128-bit hash functions
 */
export interface Hash128Options {
  /** Seed value (default: 0) */
  seed?: number;
  /** Output format (default: 'hex') */
  output?: HashOutput;
}

/** Options whose output is a bigint. */
export type BigintOptions = Hash128Options & { output: 'bigint' };

/** Options whose output is a hex string (the default). */
export type HexOptions = Hash128Options & { output?: 'hex' };

/**
 * Input type for hash functions. Strings are hashed as UTF-8; binary input as its bytes.
 */
export type HashInput = string | Uint8Array | ArrayBuffer | ArrayBufferView;

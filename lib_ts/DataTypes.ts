import { DataType } from './DataType';
import { Bitmap } from './Bitmap';

interface HasLength {
  length: number;
}
interface HasArgs {
  args: unknown[];
}

type EnumDefinition = Record<string, number>;

/**
 * Type guard for array of strings.
 */
function isStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false;
  if (value.some((i) => typeof i !== 'string')) return false;
  return true;
}

/**
 * Type guard for object with only number values.
 */
function isObjectWithNumberValues(input: unknown): input is Record<string, number> {
  return (
    typeof input === 'object' &&
    input !== null &&
    !Array.isArray(input) &&
    Object.values(input).every((i) => typeof i === 'number')
  );
}

function dataToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number): number {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Expected buffer');
  if (!Buffer.isBuffer(value)) throw new TypeError('Expected buffer');
  if (value.length !== this.length) throw new TypeError('Invalid buffer size');
  return value.copy(buffer, index);
}

function dataFromBuf(
  this: HasLength,
  buffer: Buffer,
  index: number,
  returnLength?: boolean
): Buffer {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Expected buffer');
  return buffer.subarray(index, index + this.length);
}

function boolToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number): number {
  if (typeof value !== 'boolean') throw new TypeError('Expected boolean');
  if (typeof value === 'boolean') {
    if (value == null) value = 0xff;
    else if (value) value = 0x01;
    else value = 0x00;
  }
  if (typeof value !== 'number') throw new TypeError('Could not convert boolean to number');
  buffer.writeUInt8(value, index);
  return this.length;
}

function boolFromBuf(
  this: HasLength,
  buffer: Buffer,
  index: number,
  returnLength?: boolean
): boolean | null {
  // TODO: this should actually only return a boolean or throw, but that would be a change in behaviour
  if (buffer.length - index < this.length) return null;
  const value = buffer.readUInt8(index);
  if (value === 0xff) return null;
  if (value === 0x00) return false;
  return true;
}

function uintToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number) {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeUIntLE(value, index, this.length) - index;
}

function uintFromBuf(
  this: HasLength,
  buffer: Buffer,
  index: number,
  returnLength?: boolean
): number {
  if (buffer.length - index < this.length) return 0;
  return buffer.readUIntLE(index, this.length);
}

function intToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number) {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeIntLE(value, index, this.length) - index;
}

function intFromBuf(
  this: HasLength,
  buffer: Buffer,
  index: number,
  returnLength?: boolean
): number {
  if (buffer.length - index < this.length) return 0;
  return buffer.readIntLE(index, this.length);
}

function uintToBufBE(this: HasLength, buffer: Buffer, value: unknown, index: number): number {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeUIntBE(value, index, this.length) - index;
}

function uintFromBufBE(
  this: HasLength,
  buffer: Buffer,
  index: number,
  returnLength?: boolean
): number {
  return buffer.readUIntBE(index, this.length);
}

function bitmapToBuf(
  this: HasLength & HasArgs,
  buffer: Buffer,
  value: unknown,
  index: number
): number {
  if (!isStringArray(this.args)) throw new TypeError('Expected array of strings');
  if (typeof value === 'number' || isStringArray(value) || value instanceof Bitmap) {
    return Bitmap.toBuffer(buffer, index, this.length, this.args, value);
  }
  throw new TypeError('Expected number, array of strings or Bitmap');
}

function bitmapFromBuf(this: HasLength & HasArgs, buffer: Buffer, index: number): Bitmap {
  if (!isStringArray(this.args)) throw new TypeError('Expected array of strings');
  return Bitmap.fromBuffer(buffer, index, this.length, this.args);
}

function enumToBuf(
  this: HasLength & HasArgs,
  buffer: Buffer,
  value: unknown,
  index: number
): number {
  if (typeof value === 'string' && isObjectWithNumberValues(this.args[0])) {
    value = this.args[0][value];
  }
  if (typeof value === 'undefined') throw new TypeError('Unknown enum value');
  return uintToBuf.call(this, buffer, value, index);
}

function enumFromBuf(this: HasLength & HasArgs, buffer: Buffer, index: number): string | undefined {
  const val = uintFromBuf.call(this, buffer, index);
  if (!isObjectWithNumberValues(this.args[0])) {
    throw new TypeError('Expected object with only number values');
  }
  return Object.keys(this.args[0]).find((key) => {
    // TypeScripts wants us to check again
    if (!isObjectWithNumberValues(this.args[0])) {
      throw new TypeError('Expected object with only number values');
    }
    return this.args[0] && this.args[0][key] === val;
  });
}

export const DataTypes = {
  // TODO: noData
  //
  data8: new DataType<number>(8, 'data8', 1, uintToBufBE, uintFromBufBE, 0),
  // TODO: data16
  // TODO: data24
  // TODO: data32
  // TODO: difference with data8 which returns a number?
  data40: new DataType<Buffer>(12, 'data40', 5, dataToBuf, dataFromBuf, Buffer.alloc(0)),
  // TODO: data48
  // TODO: data56
  // TODO: data64
  // TODO: why should this return null
  bool: new DataType<boolean | null>(16, 'bool', 1, boolToBuf, boolFromBuf, false),
  //
  map8: (...args: string[]) =>
    new DataType<Bitmap>(24, 'map8', 1, bitmapToBuf, bitmapFromBuf, new Bitmap(0, []), ...args),
  // TODO: map16
  // TODO: map24
  // TODO: map32
  // TODO: map40
  // TODO: map48
  // TODO: map56
  // TODO: map64
  uint8: new DataType<number>(32, 'uint8', 1, uintToBuf, uintFromBuf, 0),
  uint16: new DataType<number>(33, 'uint16', 2, uintToBuf, uintFromBuf, 0),
  uint24: new DataType<number>(34, 'uint24', 3, uintToBuf, uintFromBuf, 0),
  uint32: new DataType<number>(35, 'uint32', 4, uintToBuf, uintFromBuf, 0),
  uint40: new DataType<number>(36, 'uint40', 5, uintToBuf, uintFromBuf, 0),
  uint48: new DataType<number>(37, 'uint48', 6, uintToBuf, uintFromBuf, 0),
  //
  int8: new DataType<number>(40, 'int8', 1, intToBuf, intFromBuf, 0),
  int16: new DataType<number>(41, 'int16', 2, intToBuf, intFromBuf, 0),
  int24: new DataType<number>(42, 'int24', 3, intToBuf, intFromBuf, 0),
  int32: new DataType<number>(43, 'int32', 4, intToBuf, intFromBuf, 0),
  int40: new DataType<number>(44, 'int40', 5, intToBuf, intFromBuf, 0),
  int48: new DataType<number>(45, 'int48', 6, intToBuf, intFromBuf, 0),
  //
  enum8: (enumDefinition: EnumDefinition) =>
    new DataType<string | undefined>(
      48,
      'enum8',
      1,
      enumToBuf,
      enumFromBuf,
      undefined,
      enumDefinition
    )
  // TODO: enum16
  // TODO: enum32

  // TODO: single
  // TODO: double
  // TODO: ocstr
  // TODO: string
  // TODO: EUI48
  // TODO: EUI64
  // TODO: key128

  // TODO: uint4
  // TODO: enum4
  // TODO: map4

  // TODO: buffer
  // TODO: buffer8
  // TODO: buffer16
  // TODO: Array0
  // TODO: Array8
  // TODO: FixedString
};

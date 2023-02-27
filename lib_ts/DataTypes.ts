import { DataType } from './DataType';
import { Bitmap } from './Bitmap';

interface HasLength {
  length: number;
}
interface HasArgs {
  args: unknown[];
}

/**
 * Type guard for array of strings.
 */
function isStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false;
  if (value.some((i) => typeof i !== 'string')) return false;
  return true;
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
  if (!isStringArray(this.args)) throw new Error('Expected array of strings');
  if (typeof value === 'number' || isStringArray(value) || value instanceof Bitmap) {
    return Bitmap.toBuffer(buffer, index, this.length, this.args, value);
  }
  throw new Error('Expected number, array of strings or Bitmap');
}

function bitmapFromBuf(this: HasLength & HasArgs, buffer: Buffer, index: number): Bitmap {
  if (!isStringArray(this.args)) throw new Error('Expected array of strings');
  return Bitmap.fromBuffer(buffer, index, this.length, this.args);
}

export const DataTypes = {
  // TODO: why should this return null
  bool: new DataType<boolean | null>(16, 'bool', 1, boolToBuf, boolFromBuf, false),
  //
  data8: new DataType<number>(8, 'data8', 1, uintToBufBE, uintFromBufBE, 0),
  //
  // TODO: difference with data8 which returns a number?
  data40: new DataType<Buffer>(12, 'data40', 5, dataToBuf, dataFromBuf, Buffer.alloc(0)),
  //
  map8: (...args: string[]) =>
    new DataType<Bitmap>(24, 'map8', 1, bitmapToBuf, bitmapFromBuf, new Bitmap(0, []), ...args),
  //
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
  int48: new DataType<number>(45, 'int48', 6, intToBuf, intFromBuf, 0)
};

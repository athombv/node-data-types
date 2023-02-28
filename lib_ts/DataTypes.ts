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
  return typeof input === 'object' && input !== null && !Array.isArray(input) && Object.values(input).every((i) => typeof i === 'number');
}

function dataToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number): number {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Expected buffer');
  if (!Buffer.isBuffer(value)) throw new TypeError('Expected buffer');
  if (value.length !== this.length) throw new TypeError('Invalid buffer size');
  return value.copy(buffer, index);
}

function dataFromBuf(this: HasLength, buffer: Buffer, index: number, returnLength?: boolean): Buffer {
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

function boolFromBuf(this: HasLength, buffer: Buffer, index: number, returnLength?: boolean): boolean | null {
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

function uintFromBuf(this: HasLength, buffer: Buffer, index: number, returnLength?: boolean): number {
  if (buffer.length - index < this.length) return 0;
  return buffer.readUIntLE(index, this.length);
}

function intToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number) {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeIntLE(value, index, this.length) - index;
}

function intFromBuf(this: HasLength, buffer: Buffer, index: number, returnLength?: boolean): number {
  if (buffer.length - index < this.length) return 0;
  return buffer.readIntLE(index, this.length);
}

function uintToBufBE(this: HasLength, buffer: Buffer, value: unknown, index: number): number {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeUIntBE(value, index, this.length) - index;
}

function uintFromBufBE(this: HasLength, buffer: Buffer, index: number, returnLength?: boolean): number {
  return buffer.readUIntBE(index, this.length);
}

function bitmapToBuf(this: HasLength & HasArgs, buffer: Buffer, value: unknown, index: number): number {
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

function enumToBuf(this: HasLength & HasArgs, buffer: Buffer, value: unknown, index: number): number {
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

function utf8StringToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number) {
  if (typeof value !== 'string') throw new TypeError('Expected string');
  // Convert string to buffer
  value = Buffer.from(String(value), 'utf8');
  if (!(value instanceof Buffer)) throw new TypeError('Expected buffer');

  const length = Math.abs(this.length);
  index = buffer.writeUIntLE(value.length, index, length);
  return value.copy(buffer, index) + length;
}

function utf8StringFromBuf(this: HasLength, buffer: Buffer, index: number, returnLength?: boolean) {
  index = index || 0;
  let length = Math.abs(this.length);
  const size = buffer.readUIntLE(index, length);
  const result = buffer.subarray(index + length, index + length + size);
  length += result.length;

  let parsedResult = result.toString('utf8');
  parsedResult = parsedResult.split('\u0000')[0]; // Remove everything after string terminator
  // eslint-disable-next-line no-control-regex
  parsedResult = parsedResult.replace(/[\u0000-\u001F](\[(B|C|D|A))?/g, ''); // Replace remaining
  parsedResult = parsedResult.trim(); // Trim excessive white space

  if (typeof parsedResult !== 'string') throw new TypeError('');

  if (returnLength) {
    return {
      result: parsedResult,
      length
    };
  }
  return parsedResult;
}

function arrayToBuf(this: HasLength & HasArgs, buffer: Buffer, value: unknown, index: number): number {
  index = index || 0;
  value = typeof value !== 'undefined' ? value : [];
  const [Type] = this.args;
  if (!(Type instanceof DataType)) throw new TypeError('Expected DataType instance');

  const countSize = Math.abs(this.length);
  let size = countSize;
  if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${value}`);
  if (countSize) {
    buffer.writeIntLE(value.length, index, countSize);
  }

  for (const j in value) {
    const res = Type.toBuffer(buffer, value[j], index + size);
    if (Type.length > 0) size += Type.length;
    else if (Buffer.isBuffer(res)) size += res.length;
    else size += res;
  }
  return size;
}

function arrayFromBuf<T>(this: HasLength & HasArgs, buffer: Buffer, index: number, returnLength?: boolean) {
  index = index || 0;
  const [Type] = this.args;
  if (!(Type instanceof DataType)) throw new TypeError('Expected DataType instance');

  const countSize = Math.abs(this.length);

  const count = countSize ? buffer.readUIntLE(index, countSize) : Infinity;
  let length = countSize;
  const res = [];
  while (index + length < buffer.length && res.length < count) {
    const entry = Type.fromBuffer(buffer, index + length, true);
    if (Type.length > 0) {
      res.push(entry);
      length += Type.length;
    } else {
      if (entry.length <= 0) break;
      res.push(entry.result);
      length += entry.length;
    }
  }
  if (returnLength) {
    return {
      result: res,
      length
    };
  }
  return res;
}

// TODO: instead of defaultValue generic use this map?
type TypesMap = {
  bool: boolean | null;
  uint8: number;
};

export const DataTypes = {
  noData: new DataType<undefined | { result: null; length: 0 }>(
    0,
    'noData',
    0,
    () => 0,
    () => ({ result: null, length: 0 }),
    undefined
  ),
  //
  data8: new DataType<number>(8, 'data8', 1, uintToBufBE, uintFromBufBE, 0),
  data16: new DataType<number>(9, 'data16', 2, uintToBufBE, uintFromBufBE, 0),
  data24: new DataType<number>(10, 'data24', 3, uintToBufBE, uintFromBufBE, 0),
  data32: new DataType<number>(11, 'data32', 4, uintToBufBE, uintFromBufBE, 0),
  // TODO: difference with data8 which returns a number?
  data40: new DataType<Buffer>(12, 'data40', 5, dataToBuf, dataFromBuf, Buffer.alloc(0)),
  data48: new DataType<Buffer>(13, 'data48', 6, dataToBuf, dataFromBuf, Buffer.alloc(0)),
  data56: new DataType<Buffer>(14, 'data56', 7, dataToBuf, dataFromBuf, Buffer.alloc(0)),
  data64: new DataType<Buffer>(15, 'data64', 8, dataToBuf, dataFromBuf, Buffer.alloc(0)),
  // TODO: why should this return null
  bool: new DataType<boolean | null>(16, 'bool', 1, boolToBuf, boolFromBuf, false),
  //
  map8: (...args: string[]) => new DataType<Bitmap | undefined>(24, 'map8', 1, bitmapToBuf, bitmapFromBuf, undefined, ...args),
  map16: (...args: string[]) => new DataType<Bitmap | undefined>(25, 'map16', 2, bitmapToBuf, bitmapFromBuf, undefined, ...args),
  map24: (...args: string[]) => new DataType<Bitmap | undefined>(26, 'map24', 3, bitmapToBuf, bitmapFromBuf, undefined, ...args),
  map32: (...args: string[]) => new DataType<Bitmap | undefined>(27, 'map32', 4, bitmapToBuf, bitmapFromBuf, undefined, ...args),
  map40: (...args: string[]) => new DataType<Bitmap | undefined>(28, 'map40', 5, bitmapToBuf, bitmapFromBuf, undefined, ...args),
  map48: (...args: string[]) => new DataType<Bitmap | undefined>(29, 'map48', 6, bitmapToBuf, bitmapFromBuf, undefined, ...args),
  map56: (...args: string[]) => new DataType<Bitmap | undefined>(30, 'map56', 7, bitmapToBuf, bitmapFromBuf, undefined, ...args),
  map64: (...args: string[]) => new DataType<Bitmap | undefined>(31, 'map64', 8, bitmapToBuf, bitmapFromBuf, undefined, ...args),
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
  int48: new DataType<number>(45, 'int48', 6, intToBuf, intFromBuf, 0),
  //
  enum8: (enumDefinition: EnumDefinition) => new DataType<string | undefined>(48, 'enum8', 1, enumToBuf, enumFromBuf, undefined, enumDefinition),
  enum16: (enumDefinition: EnumDefinition) => new DataType<string | undefined>(49, 'enum16', 2, enumToBuf, enumFromBuf, undefined, enumDefinition),
  enum32: (enumDefinition: EnumDefinition) => new DataType<string | undefined>(NaN, 'enum32', 4, enumToBuf, enumFromBuf, undefined, enumDefinition),
  //
  // TODO: single
  // TODO: double
  // TODO: ocstr
  string: new DataType<string | undefined>(66, 'string', -1, utf8StringToBuf, utf8StringFromBuf, ''),
  // TODO: EUI48
  // TODO: EUI64
  // TODO: key128

  // TODO: uint4
  // TODO: enum4
  // TODO: map4

  // TODO: buffer
  // TODO: buffer8
  // TODO: buffer16
  Array0: <T>(a: DataType<T>) => new DataType<T[]>(NaN, '_Array0', -0, arrayToBuf, arrayFromBuf<T>, [], a),
  Array8: <T>(a: DataType<T>) => new DataType<T[]>(NaN, '_Array8', -1, arrayToBuf, arrayFromBuf<T>, [], a)
  // TODO: FixedString
};

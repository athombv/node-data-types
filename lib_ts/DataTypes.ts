import { DataType } from './DataType';
import { Bitmap } from './Bitmap';
import { isStringArray, isObjectWithNumberValues } from './Util';

interface HasLength {
  length: number;
}
interface HasUnknownArgs {
  args: unknown[];
}

interface HasEnumDefinitionArg {
  args: [EnumDefinition];
}

type EnumDefinition = Record<string, number>;

function dataToBuf(this: HasLength, buffer: Buffer, value: unknown, offset: number) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Expected buffer');
  if (!Buffer.isBuffer(value)) throw new TypeError('Expected buffer');
  if (value.length !== this.length) throw new TypeError('Invalid buffer size');
  return value.copy(buffer, offset);
}

function dataFromBuf(this: HasLength, buffer: Buffer, offset: number, returnLength?: boolean) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Expected buffer');
  return buffer.subarray(offset, offset + this.length);
}

function boolToBuf(this: HasLength, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'boolean') throw new TypeError('Expected boolean');
  if (typeof value === 'boolean') {
    if (value == null) value = 0xff;
    else if (value) value = 0x01;
    else value = 0x00;
  }
  if (typeof value !== 'number') throw new TypeError('Could not convert boolean to number');
  buffer.writeUInt8(value, offset);
  return this.length;
}

function boolFromBuf(this: HasLength, buffer: Buffer, offset: number, returnLength?: boolean) {
  // TODO: this should actually only return a boolean or throw, but that would be a change in behaviour
  if (buffer.length - offset < this.length) return null;
  const value = buffer.readUInt8(offset);
  if (value === 0xff) return null;
  if (value === 0x00) return false;
  return true;
}

function uintToBuf(this: HasLength, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeUIntLE(value, offset, this.length) - offset;
}

function uintFromBuf(this: HasLength, buffer: Buffer, offset: number, returnLength?: boolean) {
  if (buffer.length - offset < this.length) return 0;
  return buffer.readUIntLE(offset, this.length);
}

function intToBuf(this: HasLength, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeIntLE(value, offset, this.length) - offset;
}

function intFromBuf(this: HasLength, buffer: Buffer, offset: number, returnLength?: boolean) {
  if (buffer.length - offset < this.length) return 0;
  return buffer.readIntLE(offset, this.length);
}

function uintToBufBE(this: HasLength, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeUIntBE(value, offset, this.length) - offset;
}

function uintFromBufBE(this: HasLength, buffer: Buffer, offset: number, returnLength?: boolean) {
  return buffer.readUIntBE(offset, this.length);
}

function bitmapToBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, value: unknown, offset: number) {
  if (!isStringArray(this.args)) throw new TypeError('Expected array of strings');
  if (typeof value === 'number' || isStringArray(value) || value instanceof Bitmap) {
    return Bitmap.toBuffer(buffer, offset, this.length, this.args, value);
  }
  throw new TypeError('Expected number, array of strings or Bitmap');
}

function bitmapFromBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, offset: number) {
  if (!isStringArray(this.args)) throw new TypeError('Expected array of strings');
  return Bitmap.fromBuffer(buffer, offset, this.length, this.args);
}

function enumToBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value === 'string' && isObjectWithNumberValues(this.args[0])) {
    value = this.args[0][value];
  }
  if (typeof value === 'undefined') throw new TypeError('Unknown enum value');
  return uintToBuf.call(this, buffer, value, offset);
}

function enumFromBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, offset: number) {
  const val = uintFromBuf.call(this, buffer, offset);
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

function floatToBuf(buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeFloatLE(value, offset) - offset;
}

function floatFromBuf(buffer: Buffer, offset: number) {
  if (buffer.length - offset < 4) return 0;
  return buffer.readFloatLE(offset);
}

function doubleToBuf(buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'number') throw new TypeError('Expected number');
  return buffer.writeDoubleLE(value, offset) - offset;
}

function doubleFromBuf(buffer: Buffer, offset: number) {
  if (buffer.length - offset < 8) return 0;
  return buffer.readDoubleLE(offset);
}

function bufferToBuf(this: HasLength, buffer: Buffer, value: unknown, offset: number) {
  const countSize = Math.abs(this.length);
  // TODO?
  // if (!Buffer.isBuffer(value) && typeof value.toBuffer === 'function') value = value.toBuffer();
  // if (!Buffer.isBuffer(value) && value.buffer) value = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (!Buffer.isBuffer(value)) throw new TypeError(`Expected buffer`);

  if (countSize) {
    buffer.writeUIntLE(value.length, offset, countSize);
  }

  return value.copy(buffer, offset + countSize) + countSize;
}

function bufferFromBuf(this: HasLength, buffer: Buffer, offset: number, returnLength?: boolean) {
  offset = offset || 0;
  const countSize = Math.abs(this.length);
  const size = countSize ? buffer.readUIntLE(offset, countSize) : 0;
  const res = countSize ? buffer.subarray(offset + countSize, offset + countSize + size) : buffer.subarray(offset + countSize);

  // Seems to be unused?
  // if (size > res.length) {
  //   res.isPartial = true;
  // } // TODO: FIXME

  if (returnLength) {
    return {
      result: res,
      length: res.length + countSize
    };
  }
  return res;
}

function utf8StringToBuf(this: HasLength, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'string') throw new TypeError('Expected string');
  // Convert string to buffer
  value = Buffer.from(String(value), 'utf8');
  if (!(value instanceof Buffer)) throw new TypeError('Expected buffer');

  const length = Math.abs(this.length);
  offset = buffer.writeUIntLE(value.length, offset, length);
  return value.copy(buffer, offset) + length;
}

function utf8StringFromBuf(this: HasLength, buffer: Buffer, offset: number, returnLength?: boolean) {
  offset = offset || 0;
  let length = Math.abs(this.length);
  const size = buffer.readUIntLE(offset, length);
  const result = buffer.subarray(offset + length, offset + length + size);
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

function EUI64ToBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'string') throw new TypeError('Expected string');
  if (!value) throw new TypeError('Expected string');
  let parsedValue = value.replace(/(^0x)|\-|\:|\s/g, '').match(/.{1,2}/g);
  if (!parsedValue) throw new Error('Failed to parse EUI64');
  let reversedValue = parsedValue.reverse().join('');
  value = Buffer.from(reversedValue, 'hex');
  return dataToBuf.call(this, buffer, value, offset);
}

function EUI64FromBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, offset: number) {
  return Array.from(dataFromBuf.call(this, buffer, offset))
    .reverse()
    .map((n) => (n < 16 ? '0' : '') + n.toString(16))
    .join(':');
}

function key128ToBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'string') throw new TypeError('Expected string');
  value = Buffer.from(value.replace(/(^0x)|\-|\:|\s/g, ''), 'hex');
  return dataToBuf.call(this, buffer, value, offset);
}

function key128FromBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, offset: number) {
  return Array.from(dataFromBuf.call(this, buffer, offset))
    .map((n) => (n < 16 ? '0' : '') + n.toString(16))
    .join(':');
}
let i = 1;
const buffer = Buffer.from([1]);
const test = buffer[0] | (i & 2);

function uint4ToBuf(this: HasLength, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value !== 'number') throw new TypeError('Expected number');

  const isNibble = !Number.isInteger(offset);
  offset = Math.floor(offset);
  if (isNibble) {
    value = buffer[offset] | (value & 0xf);
  } else {
    value = (value & 0xf) << 4;
  }
  if (typeof value !== 'number') throw new TypeError('Expected number');
  buffer.writeUInt8(value, offset);
  // TODO: ?
  // return buffer.halfByte ? 0 : 1;
  return 1;
}

function uint4FromBuf(this: HasLength, buffer: Buffer, offset: number) {
  const isNibble = !Number.isInteger(offset);
  offset = Math.floor(offset);
  let res = buffer.readUInt8(offset);
  if (isNibble) {
    res &= 0xf;
  } else {
    res = (res >> 4) & 0xf;
  }
  return res;
}

function enum4ToBuf(this: HasLength & HasEnumDefinitionArg, buffer: Buffer, value: unknown, offset: number) {
  if (typeof value === 'string') value = this.args[0][value];
  if (typeof value === 'undefined') throw new TypeError(`Unknown enum value: ${value}`);
  return uint4ToBuf.call(this, buffer, value, offset);
}

function enum4FromBuf(this: HasLength & HasEnumDefinitionArg, buffer: Buffer, offset: number) {
  const val = uint4FromBuf.call(this, buffer, offset);
  return Object.keys(this.args[0]).find((k) => this.args[0][k] === val);
}

function bitmap4ToBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, value: unknown, offset: number) {
  if (!isStringArray(this.args)) throw new TypeError('Expected array of strings');
  if (!(value instanceof Bitmap) && !isStringArray(value) && typeof value !== 'number') throw new Error('Expected Bitmap or SetBits');
  const newBuf = Buffer.alloc(1);
  Bitmap.toBuffer(newBuf, 0, 1, this.args, value);
  return uint4ToBuf.call(this, buffer, newBuf[0], offset);
}

function bitmap4FromBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, offset: number) {
  if (!isStringArray(this.args)) throw new TypeError('Expected array of strings');

  const newBuf = Buffer.from([uint4FromBuf.call(this, buffer, offset)]);
  return Bitmap.fromBuffer(newBuf, 0, 1, this.args);
}

function arrayToBuf(this: HasLength & HasUnknownArgs, buffer: Buffer, value: unknown, offset: number) {
  offset = offset || 0;
  value = typeof value !== 'undefined' ? value : [];
  const [Type] = this.args;
  if (!(Type instanceof DataType)) throw new TypeError('Expected DataType instance');

  const countSize = Math.abs(this.length);
  let size = countSize;
  if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${value}`);
  if (countSize) {
    buffer.writeIntLE(value.length, offset, countSize);
  }

  for (const j in value) {
    const res = Type.toBuffer(buffer, value[j], offset + size);
    if (Type.length > 0) size += Type.length;
    else if (Buffer.isBuffer(res)) size += res.length;
    else size += res;
  }
  return size;
}

function arrayFromBuf<T>(this: HasLength & HasUnknownArgs, buffer: Buffer, offset: number, returnLength?: boolean) {
  offset = offset || 0;
  const [Type] = this.args;
  if (!(Type instanceof DataType)) throw new TypeError('Expected DataType instance');

  const countSize = Math.abs(this.length);

  const count = countSize ? buffer.readUIntLE(offset, countSize) : Infinity;
  let length = countSize;
  const res = [];
  while (offset + length < buffer.length && res.length < count) {
    const entry = Type.fromBuffer(buffer, offset + length, true);
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

function utf8FixedStringToBuf(this: HasLength, buffer: Buffer, value: unknown, offset: number) {
  value = Buffer.from(String(value), 'utf8').subarray(0, this.length);
  if (!(value instanceof Buffer)) throw new Error('Expected Buffer');
  return value.copy(buffer, offset);
}

function utf8FixedStringFromBuf(this: HasLength, buffer: Buffer, offset: number) {
  offset = offset || 0;
  const result = buffer.slice(offset, offset + this.length);

  let parsedResult = result.toString('utf8');
  parsedResult = parsedResult.split('\u0000')[0]; // Remove everything after string terminator
  parsedResult = parsedResult.replace(/[\u0000-\u001F](\[(B|C|D|A))?/g, ''); // Replace remaining
  parsedResult = parsedResult.trim(); // Trim excessive white space

  return parsedResult;
}

export const DataTypes = {
  noData: new DataType(
    0,
    'noData',
    0,
    () => 0, // Actually should be null, but this is an exception
    () => ({ result: null, length: 0 })
  ),
  //
  data8: new DataType(8, 'data8', 1, uintToBufBE, uintFromBufBE),
  data16: new DataType(9, 'data16', 2, uintToBufBE, uintFromBufBE),
  data24: new DataType(10, 'data24', 3, uintToBufBE, uintFromBufBE),
  data32: new DataType(11, 'data32', 4, uintToBufBE, uintFromBufBE),
  //
  data40: new DataType(12, 'data40', 5, dataToBuf, dataFromBuf),
  data48: new DataType(13, 'data48', 6, dataToBuf, dataFromBuf),
  data56: new DataType(14, 'data56', 7, dataToBuf, dataFromBuf),
  data64: new DataType(15, 'data64', 8, dataToBuf, dataFromBuf),
  //
  bool: new DataType(16, 'bool', 1, boolToBuf, boolFromBuf),
  //
  map8: (...args: string[]) => new DataType<Bitmap | undefined>(24, 'map8', 1, bitmapToBuf, bitmapFromBuf, ...args),
  map16: (...args: string[]) => new DataType<Bitmap | undefined>(25, 'map16', 2, bitmapToBuf, bitmapFromBuf, ...args),
  map24: (...args: string[]) => new DataType<Bitmap | undefined>(26, 'map24', 3, bitmapToBuf, bitmapFromBuf, ...args),
  map32: (...args: string[]) => new DataType<Bitmap | undefined>(27, 'map32', 4, bitmapToBuf, bitmapFromBuf, ...args),
  map40: (...args: string[]) => new DataType<Bitmap | undefined>(28, 'map40', 5, bitmapToBuf, bitmapFromBuf, ...args),
  map48: (...args: string[]) => new DataType<Bitmap | undefined>(29, 'map48', 6, bitmapToBuf, bitmapFromBuf, ...args),
  map56: (...args: string[]) => new DataType<Bitmap | undefined>(30, 'map56', 7, bitmapToBuf, bitmapFromBuf, ...args),
  map64: (...args: string[]) => new DataType<Bitmap | undefined>(31, 'map64', 8, bitmapToBuf, bitmapFromBuf, ...args),
  //
  uint8: new DataType(32, 'uint8', 1, uintToBuf, uintFromBuf),
  uint16: new DataType(33, 'uint16', 2, uintToBuf, uintFromBuf),
  uint24: new DataType(34, 'uint24', 3, uintToBuf, uintFromBuf),
  uint32: new DataType(35, 'uint32', 4, uintToBuf, uintFromBuf),
  uint40: new DataType(36, 'uint40', 5, uintToBuf, uintFromBuf),
  uint48: new DataType(37, 'uint48', 6, uintToBuf, uintFromBuf),
  //TODO:These exceed JS limits, turn to bigInts later
  // uint56: new DataType(38, 'uint56', 7, uintToBuf, uintFromBuf),
  // uint64: new DataType(39, 'uint64', 8, uintToBuf, uintFromBuf),
  //

  //
  int8: new DataType(40, 'int8', 1, intToBuf, intFromBuf),
  int16: new DataType(41, 'int16', 2, intToBuf, intFromBuf),
  int24: new DataType(42, 'int24', 3, intToBuf, intFromBuf),
  int32: new DataType(43, 'int32', 4, intToBuf, intFromBuf),
  int40: new DataType(44, 'int40', 5, intToBuf, intFromBuf),
  int48: new DataType(45, 'int48', 6, intToBuf, intFromBuf),
  //TODO:These exceed JS limits, turn to bigInts later
  // int56: new DataType(46, 'int56', 7, intToBuf, intFromBuf),
  // int64: new DataType(47, 'int64', 8, intToBuf, intFromBuf),
  //
  enum8: (enumDefinition: EnumDefinition) => new DataType(48, 'enum8', 1, enumToBuf, enumFromBuf, enumDefinition),
  enum16: (enumDefinition: EnumDefinition) => new DataType(49, 'enum16', 2, enumToBuf, enumFromBuf, enumDefinition),
  enum32: (enumDefinition: EnumDefinition) => new DataType(NaN, 'enum32', 4, enumToBuf, enumFromBuf, enumDefinition),
  //
  //TODO: javascript has no native semi precision floats
  // semi: new DataType(56, 'semi', 2, semiToBuf, semiFromBuf),

  //
  single: new DataType(57, 'single', 4, floatToBuf, floatFromBuf),
  double: new DataType(58, 'double', 8, doubleToBuf, doubleFromBuf),
  octstr: new DataType(65, 'octstr', -1, bufferToBuf, bufferFromBuf),
  string: new DataType(66, 'string', -1, utf8StringToBuf, utf8StringFromBuf),
  //
  // octstr16: new DataType(67, 'octstr16', -2),
  // string16: new DataType(68, 'string16', -2),
  // array: new DataType(72, 'array', -1),
  // struct: new DataType(76, 'struct', -1),
  // set: new DataType(80, 'set', -1),
  // bag: new DataType(81, 'bag', -1),
  // ToD: new DataType(224, 'ToD', 4),
  // date: new DataType(225, 'date', 4),
  // UTC: new DataType(226, 'UTC', 4),
  // clusterId: new DataType(232, 'clusterId', 2),
  // attribId: new DataType(233, 'attribId', 2),
  // bacOID: new DataType(234, 'bacOID', 4),
  //
  EUI48: new DataType(239, 'EUI48', 6, EUI64ToBuf, EUI64FromBuf),
  EUI64: new DataType(240, 'EUI64', 8, EUI64ToBuf, EUI64FromBuf),
  //
  key128: new DataType(241, 'key128', 16, key128ToBuf, key128FromBuf),
  //
  // unk: new DataType(255, 'unk', 0),
  //
  uint4: new DataType(NaN, 'uint4', 0.5, uint4ToBuf, uint4FromBuf),
  enum4: (enumDefinition: EnumDefinition) => new DataType(NaN, 'enum4', 0.5, enum4ToBuf, enum4FromBuf, enumDefinition),
  map4: (...arg: string[]) => new DataType<Bitmap | undefined>(NaN, 'map4', 0.5, bitmap4ToBuf, bitmap4FromBuf, ...arg),
  //
  buffer: new DataType(NaN, '_buffer', -0, bufferToBuf, bufferFromBuf),
  buffer8: new DataType(NaN, '_buffer8', -1, bufferToBuf, bufferFromBuf),
  buffer16: new DataType(NaN, '_buffer16', -2, bufferToBuf, bufferFromBuf),
  //
  Array0: <T>(a: DataType<T>) => new DataType<T[]>(NaN, '_Array0', -0, arrayToBuf, arrayFromBuf<T>, a), // TODO: generic defaultValue?
  Array8: <T>(a: DataType<T>) => new DataType<T[]>(NaN, '_Array8', -1, arrayToBuf, arrayFromBuf<T>, a), // TODO: generic defaultValue?
  //
  FixedString: (length: number) => new DataType(NaN, '_FixedString', length, utf8FixedStringToBuf, utf8FixedStringFromBuf)
};

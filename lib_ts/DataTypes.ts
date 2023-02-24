import { DataType } from "./DataType";

interface HasLength {
  length: number;
}

function dataToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number): Buffer {
  if (!Buffer.isBuffer(buffer)) throw new TypeError("expected buffer");
  if (!Buffer.isBuffer(value)) throw new TypeError("expected buffer");
  if (value.length !== this.length) throw new TypeError("invalid buffer size");
  value.copy(buffer, index);
  return value; // TODO: this used to return "value.copy(buffer, index);" why?
}

function dataFromBuf(
  this: HasLength,
  buffer: Buffer,
  index: number,
  returnLength?: boolean
): Buffer {
  if (!Buffer.isBuffer(buffer)) throw new TypeError("expected buffer");
  return buffer.slice(index, index + this.length);
}

function boolToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number): Buffer {
  if (typeof value !== "boolean") throw new TypeError("Expected boolean");
  if (typeof value === "boolean") {
    if (value == null) value = 0xff;
    else if (value) value = 0x01;
    else value = 0x00;
  }
  if (typeof value !== "number") throw new TypeError("Could not convert boolean to number");
  buffer.writeUInt8(value, index);
  return buffer; // TODO: original here returned this.length, but why? is also not buffer
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

function uintToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number): Buffer {
  if (typeof value !== "number") throw new TypeError("Expected number");
  buffer.writeUIntLE(value, index, this.length) - index;
  return buffer; // TODO: this used to return "buffer.writeUIntLE(value, i, uint8Length) - i;" why?
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

function intToBuf(this: HasLength, buffer: Buffer, value: unknown, index: number): Buffer {
  if (typeof value !== "number") throw new TypeError("Expected number");
  buffer.writeIntLE(value, index, this.length) - index;
  return buffer; // TODO: this used to return "buffer.writeIntLE(value, index, this.length) - index;" why?
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

function uintToBufBE(this: HasLength, buffer: Buffer, value: unknown, index: number): Buffer {
  if (typeof value !== "number") throw new TypeError("Expected number");
  buffer.writeUIntBE(value, index, this.length) - index;
  return buffer; // TODO: this used to return "buffer.writeUIntBE(value, index, this.length) - index;" why?
}

function uintFromBufBE(
  this: HasLength,
  buffer: Buffer,
  index: number,
  returnLength?: boolean
): number {
  return buffer.readUIntBE(index, this.length);
}

export const DataTypes = {
  bool: new DataType<boolean>(16, "bool", 1, boolToBuf, boolFromBuf, false),
  //
  data8: new DataType<number>(8, "data8", 1, uintToBufBE, uintFromBufBE, 0),
  //
  data40: new DataType<number>(12, "data40", 5, dataToBuf, dataFromBuf, 0),
  //
  uint8: new DataType<number>(32, "uint8", 1, uintToBuf, uintFromBuf, 0),
  uint16: new DataType<number>(33, "uint16", 2, uintToBuf, uintFromBuf, 0),
  uint24: new DataType<number>(34, "uint24", 3, uintToBuf, uintFromBuf, 0),
  uint32: new DataType<number>(35, "uint32", 4, uintToBuf, uintFromBuf, 0),
  uint40: new DataType<number>(36, "uint40", 5, uintToBuf, uintFromBuf, 0),
  uint48: new DataType<number>(37, "uint48", 6, uintToBuf, uintFromBuf, 0),
  //
  int8: new DataType<number>(40, "int8", 1, intToBuf, intFromBuf, 0),
  int16: new DataType<number>(41, "int16", 2, intToBuf, intFromBuf, 0),
  int24: new DataType<number>(42, "int24", 3, intToBuf, intFromBuf, 0),
  int32: new DataType<number>(43, "int32", 4, intToBuf, intFromBuf, 0),
  int40: new DataType<number>(44, "int40", 5, intToBuf, intFromBuf, 0),
  int48: new DataType<number>(45, "int48", 6, intToBuf, intFromBuf, 0),
};

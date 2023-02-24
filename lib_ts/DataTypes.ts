import { DataType } from "./DataType";

const booleanLength = 1;
const uint8Length = 1;

function boolToBuf(buffer: Buffer, value: unknown, i: number) {
  if (typeof value !== "boolean") throw new TypeError("Expected boolean");
  if (typeof value === "boolean") {
    if (value == null) value = 0xff;
    else if (value) value = 0x01;
    else value = 0x00;
  }
  if (typeof value !== "number") throw new TypeError("Could not convert boolean to number");
  buffer.writeUInt8(value, i);
  return buffer; // TODO: original here returned this.length, but why? is also not buffer
}

function boolFromBuf(buf: Buffer, i: number, returnLength?: boolean) {
  // from buffer
  if (buf.length - i < booleanLength) return null;
  const v = buf.readUInt8(i);
  if (v === 0xff) return null;
  if (v === 0x00) return false;
  return true;
}

function uintToBuf(buffer: Buffer, value: unknown, i: number) {
  // TODO: uint8Length -> this.length
  if (typeof value !== "number") throw new TypeError("Expected number");
  buffer.writeUIntLE(value, i, uint8Length) - i;
  return buffer; // TODO: this used to return "buffer.writeUIntLE(value, i, uint8Length) - i;" why?
}

function uintFromBuf(buf: Buffer, i: number, returnLength?: boolean) {
  // TODO: uint8Length -> this.length
  if (buf.length - i < uint8Length) return 0;
  return buf.readUIntLE(i, uint8Length);
}

export const DataTypes = {
  // TOOD: booleanLength -> this.length?
  // TOOD: uint8Length -> this.length?
  bool: new DataType<boolean>(16, "bool", booleanLength, boolToBuf, boolFromBuf, false),
  uint8: new DataType<number>(32, "uint8", uint8Length, uintToBuf, uintFromBuf, 0),
};

import { strict as assert } from "assert";

import Debug from "debug";
const debug = Debug("data-type");

import { DataTypes } from "../lib_ts/DataTypes";
import { Struct, StructClass } from "../lib_ts/Struct";

assert.strictEqual(DataTypes.bool.fromBuffer(Buffer.from([1]), 0), true);
assert.deepEqual(DataTypes.bool.toBuffer(Buffer.from([0]), true, 0), Buffer.from([1]));

assert.strictEqual(DataTypes.uint8.fromBuffer(Buffer.from([12]), 0), 12);
assert.deepEqual(DataTypes.uint8.toBuffer(Buffer.from([0]), 12, 0), Buffer.from([12]));

// debug("booleanDataType from buffer", DataTypes.bool.fromBuffer(Buffer.from([1]), 0));
// debug("booleanDataType to buffer", DataTypes.bool.toBuffer(Buffer.from([0]), true, 0));
// debug("uint8DataType from buffer", DataTypes.uint8.fromBuffer(Buffer.from([12]), 0));
// debug("uint8DataType to buffer", DataTypes.uint8.toBuffer(Buffer.from([0]), 12, 0));

const structDefinition = {
  booleanProp: DataTypes.bool,
  uint8Prop: DataTypes.uint8,
};

const structObject = {
  booleanProp: true,
  uint8Prop: 123,
};

const structClass = new StructClass<typeof structDefinition>(structDefinition);
const structClassToBuffer = structClass.toBuffer(Buffer.from([0, 0]), structObject);
debug("structClassToBuffer", structClassToBuffer);
const structClassFromBuffer = structClass.fromBuffer(structClassToBuffer);
debug("structClassFromBuffer", structClassFromBuffer);
assert.deepEqual(structClassFromBuffer, structObject);
// structClassFromBuffer.booleanProp.trim();
// structClassFromBuffer.uint8Prop.trim();

const structFn = Struct<typeof structDefinition>("dummyStruct", structDefinition);
const structFnToBuffer = structFn.toBuffer(Buffer.from([0, 0]), structObject);
debug("structFnToBuffer", structFnToBuffer);
const structFnFromBuffer = structFn.fromBuffer(structFnToBuffer);
debug("structFnFromBuffer", structFnFromBuffer);
assert.deepEqual(structFnFromBuffer, structObject);
// structFnFromBuffer.booleanProp.trim();
// structFnFromBuffer.uint8Prop.trim()

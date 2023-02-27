import { strict as assert } from 'assert';

import { DataTypes } from '../lib_ts/DataTypes';
import { Struct, StructClass } from '../lib_ts/Struct';

const structDefinition = {
  booleanProp: DataTypes.bool,
  uint8Prop: DataTypes.uint8,
  uint16Prop: DataTypes.uint16,
  data8Prop: DataTypes.data8
};

const structObject = {
  booleanProp: true,
  uint8Prop: 123,
  uint16Prop: 30000,
  data8Prop: 8
};

const structBuffer = Buffer.from([0x01, 0x7b, 0x30, 0x75, 0x08]);

describe('Struct class (new)', function () {
  it('should parse test data to buffer', function () {
    const emptyBuffer = () => Buffer.alloc(5);
    const structClass = new StructClass<typeof structDefinition>(structDefinition);
    const structClassToBuffer = structClass.toBuffer(emptyBuffer(), structObject);
    assert.deepEqual(structClassToBuffer, structBuffer);
  });
  it('should parse test data from buffer', function () {
    const structClass = new StructClass<typeof structDefinition>(structDefinition);
    const structClassFromBuffer = structClass.fromBuffer(structBuffer);
    assert.deepEqual(structClassFromBuffer, structObject);
  });
});

describe('Struct factory (new)', function () {
  it('should parse test data to buffer', function () {
    const emptyBuffer = () => Buffer.alloc(5);
    const structFn = Struct<typeof structDefinition>('dummyStruct', structDefinition);
    const structFnToBuffer = structFn.toBuffer(emptyBuffer(), structObject);
    assert.deepEqual(structFnToBuffer, structBuffer);
  });
  it('should parse test data from buffer', function () {
    const structFn = Struct<typeof structDefinition>('dummyStruct', structDefinition);
    const structFnFromBuffer = structFn.fromBuffer(structBuffer);
    assert.deepEqual(structFnFromBuffer, structObject);
  });
});

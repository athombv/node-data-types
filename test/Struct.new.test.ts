import { strict as assert } from 'assert';

import { DataTypes } from '../lib_ts/DataTypes';
import { Struct } from '../lib_ts/Struct';

// TODO: check how Struct and static Struct.fromBuffer() is used by de following repos:
// - node-zigbee-clusters
// - node-homey-bridge
// - node-zigbee
// - node-zstack

// TODO: Nested structs

const structDefinitionOne = {
  booleanProp: DataTypes.bool,
  uint8Prop: DataTypes.uint8,
  uint16Prop: DataTypes.uint16,
  data8Prop: DataTypes.data8
};

const structObjectOne = {
  booleanProp: true,
  uint8Prop: 123,
  uint16Prop: 30000,
  data8Prop: 8
};

const structBufferOne = Buffer.from([0x01, 0x7b, 0x30, 0x75, 0x08]);

const structDefinitionTwo = {
  field1: DataTypes.string,
  field2: DataTypes.uint16,
  field3: DataTypes.enum8({
    opt1: 1,
    opt2: 2,
    opt3: 3
  }),
  field4: DataTypes.Array8(DataTypes.uint16),
  field5: DataTypes.map8('bit1', 'bit2', 'bit3'),
  field6: DataTypes.map16('bit1', 'bit2', 'bit3', 'bit4', 'bit5', 'bit6', 'bit7', 'bit8', 'bit9'),
  field7: DataTypes.data40
};

const structObjectTwo = {
  field1: 'test',
  field2: 500,
  field3: 'opt3',
  field4: [1, 2, 3, 4],
  field5: ['bit2'],
  field6: ['bit2', 'bit9'],
  field7: Buffer.alloc(5, 1)
};

const structBufferTwo = Buffer.from([
  4, 116, 101, 115, 116, 244, 1, 3, 4, 1, 0, 2, 0, 3, 0, 4, 0, 2, 2, 1, 1, 1, 1, 1, 1
]);

describe('Struct', function () {
  describe('test struct one', function () {
    let data;
    let dataBuf: Buffer;
    it('should parse test data to buffer', function () {
      const TestStruct = Struct('TestStruct', structDefinitionOne);
      data = new TestStruct(structObjectOne);
      dataBuf = data.toBuffer();
      assert(dataBuf.equals(Buffer.from('017b307508', 'hex')));
    });
    it('should parse test data from buffer', function () {
      const TestStruct = Struct('TestStruct', structDefinitionOne);
      data = new TestStruct(structObjectOne);
      dataBuf = data.toBuffer();

      const refData = TestStruct.fromBuffer(dataBuf);
      // refData.uint8Prop.trim()
      // refData.uint8Profp.trim()
      assert.equal(refData.booleanProp, structObjectOne.booleanProp);
      assert.equal(refData.data8Prop, structObjectOne.data8Prop);
      assert.equal(refData.uint16Prop, structObjectOne.uint16Prop);
      assert.equal(refData.uint8Prop, structObjectOne.uint8Prop);
    });
    it('[static] should parse test data to buffer', function () {
      const emptyBuffer = () => Buffer.alloc(5);
      const TestStruct = Struct('TestStruct', structDefinitionOne);
      const dataBuf = TestStruct.toBuffer(emptyBuffer(), structObjectOne, 0);
      assert.deepEqual(dataBuf, structBufferOne);
    });
    it('[static] should parse test data from buffer', function () {
      const TestStruct = Struct('TestStruct', structDefinitionOne);
      const refData = TestStruct.fromBuffer(structBufferOne);
      // refData.booleanProp?.trim();
      // refData.bla;
      assert.deepEqual(refData, structObjectOne);
    });
  });

  describe('test struct two', function () {
    let data;
    let dataBuf: Buffer;
    it('should parse test data to buffer', function () {
      const TestStruct = Struct('TestStruct', structDefinitionTwo);
      data = new TestStruct(structObjectTwo);
      dataBuf = data.toBuffer();
      assert(
        dataBuf.equals(Buffer.from('0474657374f401030401000200030004000202010101010101', 'hex'))
      );
    });
    it('should parse test data from buffer', function () {
      const TestStruct = Struct('TestStruct', structDefinitionTwo);
      data = new TestStruct(structObjectTwo);
      dataBuf = data.toBuffer();

      const refData = TestStruct.fromBuffer(dataBuf);
      // refData.booleanProp.trim();
      // refData.field2.trim();
      // refData.field3
      assert.equal(refData.field1, structObjectTwo.field1);
      assert.equal(refData.field2, structObjectTwo.field2);
      assert.equal(refData.field3, structObjectTwo.field3);
      assert.deepEqual(refData.field4, structObjectTwo.field4);
      // TODO: assert bitmap values
      // assert(refData.field5.bit2);
      // assert.deepEqual(refData.field5.toArray(), ['bit2']);
      // assert(refData.field6.bit2);
      // assert(refData.field6.bit9);
      // assert.deepEqual(refData.field6.toArray(), ['bit2', 'bit9']);
      assert.deepEqual(refData.field7, Buffer.alloc(5, 1));
    });
    it('[static] should parse test data to buffer', function () {
      const emptyBuffer = () => Buffer.alloc(25);
      const TestStruct = Struct('TestStruct', structDefinitionTwo);
      const dataBuf = TestStruct.toBuffer(emptyBuffer(), structObjectTwo, 0);
      assert.deepEqual(dataBuf, structBufferTwo);
    });
    it('[static] should parse test data from buffer', function () {
      const TestStruct = Struct('TestStruct', structDefinitionTwo);
      const refData = TestStruct.fromBuffer(structBufferTwo);
      // refData.booleanProp.trim();
      // refData.bla;

      // @ts-expect-error hack to compare array with Bitmap instance
      refData.field5 = refData.field5?.getBits();
      // @ts-expect-error hack to compare array with Bitmap instance
      refData.field6 = refData.field6?.getBits();

      assert.deepEqual(refData, structObjectTwo);
    });
  });
});
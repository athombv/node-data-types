'use strict';

const assert = require('assert').strict;

const { getDataTypes, getStruct } = require('./util');

const Struct = getStruct();
const DataTypes = getDataTypes();

const TestStruct = Struct('TestStruct', {
  field1: DataTypes.string,
  field2: DataTypes.uint16,
  field3: DataTypes.enum8({
    opt1: 1,
    opt2: 2,
    opt3: 3,
  }),
  field4: DataTypes.Array8(DataTypes.uint16),
  field5: DataTypes.map8('bit1', 'bit2', 'bit3'),
  field6: DataTypes.map16('bit1', 'bit2', 'bit3', 'bit4', 'bit5', 'bit6', 'bit7', 'bit8', 'bit9'),
});

const testData = {
  field1: 'test',
  field2: 500,
  field3: 'opt3',
  field4: [1, 2, 3, 4],
  field5: ['bit2'],
  field6: ['bit2', 'bit9'],
};

const data = new TestStruct(testData);
const dataBuf = data.toBuffer();

describe('Struct', function() {
  it('should parse test data to buffer', function() {
    assert(dataBuf.equals(Buffer.from('0474657374f40103040100020003000400020201', 'hex')));
  });
  it('should parse test data from buffer', function() {
    const refData = TestStruct.fromBuffer(dataBuf);

    assert.equal(refData.field1, testData.field1);
    assert.equal(refData.field2, testData.field2);
    assert.equal(refData.field3, testData.field3);
    assert.deepEqual(refData.field4, testData.field4);
    assert(refData.field5.bit2);
    assert.deepEqual(refData.field5.toArray(), ['bit2']);
    assert(refData.field6.bit2);
    assert(refData.field6.bit9);
    assert.deepEqual(refData.field6.toArray(), ['bit2', 'bit9']);
  });
});

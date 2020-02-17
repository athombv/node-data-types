'use strict';

const assert = require('assert');
const {DataTypes, Struct, DataType} = require('../');

const TestStruct = Struct('TestStruct', {
  field1: DataTypes.string,
  field2: DataTypes.uint16,
  field3: DataTypes.enum8({
    opt1: 1,
    opt2: 2,
    opt3: 3
  }),
  field4: DataTypes.Array8(DataTypes.uint16),
  field5: DataTypes.map8('bit1', 'bit2', 'bit3'),
});

const testData = {
  field1: 'test',
  field2: 500,
  field3: 'opt3',
  field4: [1,2,3,4],
  field5: ['bit2'],
};

const data = new TestStruct(testData);

const dataBuf = data.toBuffer();
assert(dataBuf.equals(Buffer.from('0474657374f4010304010002000300040002','hex')));

const refData = TestStruct.fromBuffer(dataBuf);

assert.equal(refData.field1, testData.field1);
assert.equal(refData.field2, testData.field2);
assert.equal(refData.field3, testData.field3);
assert.deepEqual(refData.field4, testData.field4);
assert(refData.field5.bit2);
assert.deepEqual(refData.field5.toArray(), ['bit2']);

console.log('OK!');
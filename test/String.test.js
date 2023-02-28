'use strict';

const assert = require('assert').strict;

const { getDataTypes } = require('./util');

const DataTypes = getDataTypes();
const dummyTestString = 'dummyTestString';
const dummyTestStringArray = [
  0x64, 0x75, 0x6d, 0x6d, 0x79, 0x54, 0x65, 0x73, 0x74, 0x53, 0x74, 0x72, 0x69, 0x6e, 0x67,
];

describe('string', function() {
  it('should parse to buffer', function() {
    const buffer = Buffer.alloc(dummyTestString.length + 1);
    DataTypes.string.toBuffer(buffer, dummyTestString, 0);
    assert.deepEqual(buffer, Buffer.from([dummyTestString.length, ...dummyTestStringArray]));
  });
  it('should parse from buffer', function() {
    assert.equal(DataTypes.string.fromBuffer(
      Buffer.from([dummyTestString.length, ...dummyTestStringArray]), 0,
    ),
    dummyTestString);
  });
  it('should have default value', function() {
    assert.equal(DataTypes.string.defaultValue, '');
  });
});

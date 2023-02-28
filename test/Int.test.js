'use strict';

const assert = require('assert').strict;

const { getDataTypes } = require('./util');

const DataTypes = getDataTypes();

describe('uint8', function() {
  it('should parse to buffer', function() {
    const buffer = Buffer.from([0]);
    DataTypes.uint8.toBuffer(buffer, 12, 0);
    assert.deepEqual(buffer, Buffer.from([12]));
  });
  it('should parse from buffer', function() {
    assert.equal(DataTypes.uint8.fromBuffer(Buffer.from([12]), 0), 12);
  });
  it('should have default value', function() {
    assert.equal(DataTypes.uint8.defaultValue, 0);
  });
});

'use strict';

const assert = require('assert').strict;

const { getDataTypes } = require('./util');

const DataTypes = getDataTypes();

describe('bool', function() {
  it('should parse to buffer', function() {
    const buffer = Buffer.from([0]);
    DataTypes.bool.toBuffer(buffer, true, 0);
    assert.deepEqual(buffer, Buffer.from([1]));
  });
  it('should parse from buffer', function() {
    assert.equal(DataTypes.bool.fromBuffer(Buffer.from([1]), 0), true);
  });
  it('should have default value', function() {
    assert.equal(DataTypes.bool.defaultValue, false);
  });
});

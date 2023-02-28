'use strict';

const assert = require('assert').strict;

const { getDataTypes } = require('./util');

const DataTypes = getDataTypes();

describe('enum8', function() {
  let TestEnum;

  beforeEach(function() {
    TestEnum = DataTypes.enum8({
      VALUE_A: 0x1,
      VALUE_B: 0x2,
    });
  });

  it('should parse to buffer', function() {
    const buffer = Buffer.from([0]);
    TestEnum.toBuffer(buffer, 'VALUE_A', 0);
    assert.deepEqual(buffer, Buffer.from([0x1]));
  });
  it('should parse from buffer', function() {
    const buffer = Buffer.from([0x2]);
    assert.equal(TestEnum.fromBuffer(buffer, 0), 'VALUE_B');
  });
  it('should have default value', function() {
    assert.equal(DataTypes.enum8.defaultValue, undefined);
  });
});

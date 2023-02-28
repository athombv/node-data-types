'use strict';

const assert = require('assert').strict;

const { getDataTypes } = require('./util');

const DataTypes = getDataTypes();

describe('Array', function() {
  describe('uint8', function() {
    it('should parse to buffer', function() {
      const array = [1, 2, 3, 4];
      const buffer = Buffer.alloc(array.length + 1);
      DataTypes.Array8(DataTypes.uint8).toBuffer(buffer, array);
      assert.deepEqual(buffer, Buffer.from([array.length, ...array]));
    });
    it('should parse from buffer', function() {
      assert.deepEqual(DataTypes.Array8(DataTypes.uint8).fromBuffer(
        Buffer.from([2, 1, 2]), 0,
      ), [1, 2]);
    });
    it('should have default value', function() {
      assert.deepEqual(DataTypes.Array8(DataTypes.uint8).defaultValue, []);
    });
  });
  describe('uint16', function() {
    it('should parse to buffer', function() {
      const array = [1, 2, 3, 4];
      const buffer = Buffer.alloc((array.length * DataTypes.uint16.length) + 1);
      DataTypes.Array8(DataTypes.uint16).toBuffer(buffer, array);
      assert.deepEqual(buffer, Buffer.from([array.length, 1, 0, 2, 0, 3, 0, 4, 0]));
    });
    it('should parse from buffer', function() {
      assert.deepEqual(DataTypes.Array8(DataTypes.uint16).fromBuffer(
        Buffer.from([4, 0x5e, 0x01, 0x2c, 0x01]), 0,
      ), [350, 300]);
    });
    it('should have default value', function() {
      assert.deepEqual(DataTypes.Array8(DataTypes.uint16).defaultValue, []);
    });
  });
});

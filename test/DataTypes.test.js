'use strict';

const assert = require('assert').strict;
const { DataTypes } = require('..');

describe('DataTypes', function() {
  describe('bool', function() {
    it('should parse to buffer', function() {
      const buffer = Buffer.from([0]);
      DataTypes.bool.toBuffer(buffer, true, 0);
      assert.deepEqual(buffer, Buffer.from([1]));
    });
    it('should parse from buffer', function() {
      assert.strictEqual(DataTypes.bool.fromBuffer(Buffer.from([1]), 0), true);
    });
  });
  describe('uint8', function() {
    it('should parse to buffer', function() {
      const buffer = Buffer.from([0]);
      DataTypes.uint8.toBuffer(buffer, 12, 0);
      assert.deepEqual(buffer, Buffer.from([12]));
    });
    it('should parse from buffer', function() {
      assert.strictEqual(DataTypes.uint8.fromBuffer(Buffer.from([12]), 0), 12);
    });
  });
  describe('map8', function() {
    const bits = ['bit1', 'bit2', 'bit3', 'bit4'];
    const bitValue = 0b0101;
    const bufferSize = 8;
    const bufferOffset = 4;
    let testMap;
    let expectedBuffer;
    beforeEach(function() {
      testMap = DataTypes.map8(...bits)
        .fromBuffer(Buffer.of(bitValue));
      expectedBuffer = Buffer.of(0, 0, 0, 0, bitValue, 0, 0, 0);
    });

    it('should parse to buffer', function() {
      // Test non-static toBuffer
      const buffer = Buffer.alloc(bufferSize);
      testMap.toBuffer(buffer, bufferOffset);
      assert.deepEqual(buffer, expectedBuffer);
    });
    it('should parse static to buffer', function() {
      // Test static toBuffer
      const buffer = Buffer.alloc(bufferSize);
      testMap.constructor.toBuffer(buffer, bufferOffset, testMap.length, bits, testMap);
      assert.deepEqual(buffer, expectedBuffer);
    });
  });
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
      assert.strictEqual(TestEnum.fromBuffer(buffer, 0), 'VALUE_B');
    });
  });
});

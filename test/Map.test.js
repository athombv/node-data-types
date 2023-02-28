'use strict';

const assert = require('assert').strict;

const { getDataTypes, getBitmap } = require('./util');

const DataTypes = getDataTypes();

const Bitmap = getBitmap();

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
  it('should have default value', function() {
    const emptyBitmap = new Bitmap(Buffer.from([0]), []);
    assert(DataTypes.map8().defaultValue instanceof Bitmap);
    assert.deepEqual(DataTypes.map8().defaultValue, emptyBitmap);
  });
});

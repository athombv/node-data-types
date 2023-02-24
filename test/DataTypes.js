'use strict';

const assert = require('assert');
const { DataTypes } = require('../');

const bits = ['bit1', 'bit2', 'bit3', 'bit4'];
const bitValue = 0b0101;
const testMap = DataTypes.map8(...bits)
  .fromBuffer(Buffer.of(bitValue));

const bufferSize = 8;
const bufferOffset = 4;
const expectedBuffer = Buffer.of(0, 0, 0, 0, bitValue, 0, 0, 0);

// Test non-static toBuffer
let buffer = Buffer.alloc(bufferSize);
testMap.toBuffer(buffer, bufferOffset);
assert.deepEqual(buffer, expectedBuffer, 'Non-static toBuffer failed');

// Test static toBuffer
buffer = Buffer.alloc(bufferSize);
testMap.constructor.toBuffer(buffer, bufferOffset, testMap.length, bits, testMap);
assert.deepEqual(buffer, expectedBuffer, 'Static toBuffer failed');

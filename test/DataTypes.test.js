'use strict';

const assert = require('assert');
const { DataTypes } = require('..');

const bits = ['bit1', 'bit2', 'bit3', 'bit4'];
const bitValue = 0b0101;
const testMap = DataTypes.map8(...bits)
  .fromBuffer(Buffer.of(bitValue));

const bufferSize = 8;
const bufferOffset = 4;
const expectedBuffer = Buffer.of(0, 0, 0, 0, bitValue, 0, 0, 0);

describe('DataType', function() {
  describe('map8', function() {
    it('should parse to buffer', function() {
      // Test non-static toBuffer
      const buffer = Buffer.alloc(bufferSize);
      testMap.toBuffer(buffer, bufferOffset);
      assert.deepEqual(buffer, expectedBuffer, 'Non-static toBuffer failed');
    });
    it('should parse static to buffer', function() {
      // Test static toBuffer
      const buffer = Buffer.alloc(bufferSize);
      testMap.constructor.toBuffer(buffer, bufferOffset, testMap.length, bits, testMap);
      assert.deepEqual(buffer, expectedBuffer, 'Static toBuffer failed');
    });

    // This test demonstrates an issue with copying maps with undefined/null fields
    // The copy operation throws an error when copying if there are undefined fields
    // This test is skipped as it currently fails, but shows the issue
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('copy undefined field type error issue', async function() {
      const Map8 = DataTypes.map8('first', 'second', 'third', undefined, 'fourth');
      const brokenMap = Map8.fromBuffer(Buffer.from([0b11111]));

      // This throws because `setBits` tries to map `null` or `undefined` to a field name which
      // does not exist therefore it has no way of knowing what index to set and throws an error
      // as expected.
      brokenMap.copy();

      /*
     TypeError: undefined is an invalid field
      at /Users/robinbolscher/development/node-data-types/lib/DataTypes.js:77:44
      at Array.map (<anonymous>)
      at Bitmap.setBits (lib/DataTypes.js:76:10)
      at new Bitmap (lib/DataTypes.js:39:23)
      at Bitmap.copy (lib/DataTypes.js:129:12)
      at Context.<anonymous> (test/DataTypes.test.js:41:17)
      at process.processImmediate (node:internal/timers:476:21)
      */
    });

    // This test demonstrates an issue with copying maps with null/undefined fields
    // The copied map can lose null fields in the toArray representation
    // This test is skipped as it currently fails, but shows the issue
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('copy inequality issue', async function() {
      const Map8 = DataTypes.map8('first', 'second', 'third', null, 'fourth', undefined, 'fifth');
      const brokenMap = Map8.fromBuffer(Buffer.from([0b1111111]));
      const brokenMapArray = brokenMap.toArray();
      const copiedBrokenMap = brokenMap.copy();
      const copiedBrokenMapArray = copiedBrokenMap.toArray();

      assert.deepEqual(brokenMapArray, copiedBrokenMapArray);
      /*
        AssertionError [ERR_ASSERTION]: Expected values to be loosely deep-equal:
        [
          'first',
          'second',
          'third',
          null,
          'fourth',
          null,
          'fifth'
        ]

        should loosely deep-equal

        [
          'first',
          'second',
          'third',
          null,
          'fourth',
          'fifth'
        ]
      */
    });
  });
});

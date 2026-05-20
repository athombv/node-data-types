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

    describe('source buffer aliasing', function() {
      it('should not share memory with the source buffer after fromBuffer', function() {
        const source = Buffer.from([0xff]);
        const map = DataTypes.map8('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h')
          .fromBuffer(source, 0);

        // Snapshot bits, mutate source, read again. If the Bitmap aliases
        // source memory, the second read observes the mutation.
        const bitsBefore = map.getBits();
        source[0] = 0x00;
        const bitsAfter = map.getBits();

        assert.deepEqual(bitsBefore, bitsAfter,
          'Bitmap must own its bytes; mutating source must not affect parsed value');
        assert.deepEqual(bitsAfter, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
      });
    });
  });
});

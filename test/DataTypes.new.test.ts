import { strict as assert } from 'assert';

import { DataType } from '../lib_ts/DataType';
import { DataTypes } from '../lib_ts/DataTypes';
import { Bitmap } from '../lib_ts/Bitmap';

describe('DataTypes (new)', function () {
  describe('bool', function () {
    it('should parse to buffer', function () {
      const buffer = Buffer.from([0]);
      DataTypes.bool.toBuffer(buffer, true, 0);
      assert.deepEqual(buffer, Buffer.from([1]));
    });
    it('should parse from buffer', function () {
      assert.strictEqual(DataTypes.bool.fromBuffer(Buffer.from([1]), 0), true);
    });
    it('should have default value', function () {
      assert.equal(DataTypes.bool.defaultValue, false);
    });
  });
  describe('uint8', function () {
    it('should parse to buffer', function () {
      const buffer = Buffer.from([0]);
      DataTypes.uint8.toBuffer(buffer, 12, 0);
      assert.deepEqual(buffer, Buffer.from([12]));
    });
    it('should parse from buffer', function () {
      assert.strictEqual(DataTypes.uint8.fromBuffer(Buffer.from([12]), 0), 12);
    });
    it('should have default value', function () {
      assert.equal(DataTypes.uint8.defaultValue, 0);
    });
  });
  describe('map8', function () {
    const bits = ['bit1', 'bit2', 'bit3', 'bit4'];
    const bitValue = 0b0101;
    const bufferSize = 8;
    const bufferOffset = 4;
    let testMap: Bitmap | undefined;
    let expectedBuffer: Buffer;
    beforeEach(function () {
      testMap = DataTypes.map8(...bits).fromBuffer(Buffer.of(bitValue), 0);
      expectedBuffer = Buffer.of(0, 0, 0, 0, bitValue, 0, 0, 0);
    });

    it('should parse to buffer', function () {
      if (!(testMap instanceof Bitmap)) throw new Error('Expected Bitmap instance');

      // Test non-static toBuffer
      const buffer = Buffer.alloc(bufferSize);
      testMap.toBuffer(buffer, bufferOffset);
      assert.deepEqual(buffer, expectedBuffer);
    });
    it('should parse static to buffer', function () {
      if (!(testMap instanceof Bitmap)) throw new Error('Expected Bitmap instance');

      // Test static toBuffer
      const buffer = Buffer.alloc(bufferSize);
      Bitmap.toBuffer(buffer, bufferOffset, testMap.length, bits, testMap);
      assert.deepEqual(buffer, expectedBuffer);
    });
    it('should have default value', function () {
      const emptyBitmap = new Bitmap(Buffer.from([0]), []);
      assert(DataTypes.map8().defaultValue instanceof Bitmap);
      assert.deepEqual(DataTypes.map8().defaultValue, emptyBitmap);
    });
  });
  describe('enum8', function () {
    let TestEnum: DataType<string | undefined>;

    beforeEach(function () {
      TestEnum = DataTypes.enum8({
        VALUE_A: 0x1,
        VALUE_B: 0x2
      });
    });

    it('should parse to buffer', function () {
      const buffer = Buffer.from([0]);
      TestEnum.toBuffer(buffer, 'VALUE_A', 0);
      assert.deepEqual(buffer, Buffer.from([0x1]));
    });
    it('should parse from buffer', function () {
      const buffer = Buffer.from([0x2]);
      assert.strictEqual(TestEnum.fromBuffer(buffer, 0), 'VALUE_B');
    });
    it('should have default value', function () {
      assert.equal(DataTypes.enum8({}).defaultValue, undefined);
    });
  });
});

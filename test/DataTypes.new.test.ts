import { strict as assert } from 'assert';

import { DataTypes } from '../lib_ts/DataTypes';

describe('DataType', function () {
  describe('bool', function () {
    it('should parse to buffer', function () {
      assert.deepEqual(DataTypes.bool.toBuffer(Buffer.from([0]), true, 0), Buffer.from([1]));
    });
    it('should parse from buffer', function () {
      assert.strictEqual(DataTypes.bool.fromBuffer(Buffer.from([1]), 0), true);
    });
  });
  describe('uint8', function () {
    it('should parse to buffer', function () {
      assert.deepEqual(DataTypes.uint8.toBuffer(Buffer.from([0]), 12, 0), Buffer.from([12]));
    });
    it('should parse from buffer', function () {
      assert.strictEqual(DataTypes.uint8.fromBuffer(Buffer.from([12]), 0), 12);
    });
  });
});

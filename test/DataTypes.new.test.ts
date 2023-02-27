import { strict as assert } from 'assert';

import { DataTypes } from '../lib_ts/DataTypes';

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
});

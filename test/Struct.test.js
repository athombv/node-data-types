'use strict';

const assert = require('assert');
const { DataTypes, Struct } = require('..');

const TestStruct = Struct('TestStruct', {
  field1: DataTypes.string,
  field2: DataTypes.uint16,
  field3: DataTypes.enum8({
    opt1: 1,
    opt2: 2,
    opt3: 3,
  }),
  field4: DataTypes.Array8(DataTypes.uint16),
  field5: DataTypes.map8('bit1', 'bit2', 'bit3'),
  field6: DataTypes.map16('bit1', 'bit2', 'bit3', 'bit4', 'bit5', 'bit6', 'bit7', 'bit8', 'bit9'),
});

const testData = {
  field1: 'test',
  field2: 500,
  field3: 'opt3',
  field4: [1, 2, 3, 4],
  field5: ['bit2'],
  field6: ['bit2', 'bit9'],
};

const data = new TestStruct(testData);
const dataBuf = data.toBuffer();

describe('Struct', function() {
  it('should parse test data to buffer', function() {
    assert(dataBuf.equals(Buffer.from('0474657374f40103040100020003000400020201', 'hex')));
  });
  it('should encode missing fields with default values by default', function() {
    const S = Struct('DefaultMissing', {
      a: DataTypes.uint8,
      b: DataTypes.uint8,
    });
    const instance = new S({ a: 42 });
    const buf = instance.toBuffer();

    // Both fields encoded: a=42, b=0 (default)
    assert.equal(buf.length, 2);
    assert.equal(buf[0], 42);
    assert.equal(buf[1], 0);
  });
  it('should skip missing fields in nested struct without padding', function() {
    const Inner = Struct('InnerSkip', {
      x: DataTypes.uint8,
      y: DataTypes.uint8,
    }, { encodeMissingFieldsBehavior: 'skip' });

    const Outer = Struct('OuterWithInner', {
      id: DataTypes.uint8,
      inner: Inner,
    });

    const instance = new Outer({
      id: 5,
      inner: { x: 10 },
    });

    const buf = instance.toBuffer();
    // id (1 byte) + inner.x (1 byte), no padding for missing inner.y
    assert.equal(buf.length, 2);
    assert.equal(buf[0], 5);
    assert.equal(buf[1], 10);
  });

  it('should skip missing fields in array of structs without padding', function() {
    const Item = Struct('ItemSkip', {
      a: DataTypes.uint8,
      b: DataTypes.uint8,
    }, { encodeMissingFieldsBehavior: 'skip' });

    const S = Struct('ArrayContainer', {
      items: DataTypes.Array8(Item),
    });

    const instance = new S({
      items: [
        { a: 1 },
        { a: 2, b: 20 },
        { b: 30 },
      ],
    });

    const buf = instance.toBuffer();
    // Array8: 1 byte length + items
    // item1: 1 byte (a=1)
    // item2: 2 bytes (a=2, b=20)
    // item3: 1 byte (b=30)
    // Total: 1 + 1 + 2 + 1 = 5
    assert.equal(buf.length, 5);
    assert.equal(buf[0], 3); // array length
    assert.equal(buf[1], 1); // item1.a
    assert.equal(buf[2], 2); // item2.a
    assert.equal(buf[3], 20); // item2.b
    assert.equal(buf[4], 30); // item3.b
  });

  it('should handle mixed skip and default behavior in nested structures', function() {
    const SkipInner = Struct('SkipInner', {
      x: DataTypes.uint8,
      y: DataTypes.uint8,
    }, { encodeMissingFieldsBehavior: 'skip' });

    const DefaultInner = Struct('DefaultInner', {
      p: DataTypes.uint8,
      q: DataTypes.uint8,
    });

    const Outer = Struct('MixedOuter', {
      skip: SkipInner,
      default: DefaultInner,
    });

    const instance = new Outer({
      skip: { x: 5 },
      default: { p: 10 },
    });

    const buf = instance.toBuffer();
    // skip: 1 byte (x=5)
    // default: 2 bytes (p=10, q=0)
    // Total: 3
    assert.equal(buf.length, 3);
    assert.equal(buf[0], 5);
    assert.equal(buf[1], 10);
    assert.equal(buf[2], 0);
  });
  it('should produce identical output with skip option when all fields provided', function() {
    const defsA = { a: DataTypes.uint8, b: DataTypes.uint8 };
    const defsB = { a: DataTypes.uint8, b: DataTypes.uint8 };
    const Default = Struct('AllFieldsDefault', defsA);
    const Skip = Struct('AllFieldsSkip', defsB, { encodeMissingFieldsBehavior: 'skip' });
    const d = new Default({ a: 1, b: 2 });
    const s = new Skip({ a: 1, b: 2 });
    assert(d.toBuffer().equals(s.toBuffer()));
  });
  it('should parse test data from buffer', function() {
    const refData = TestStruct.fromBuffer(dataBuf);

    assert.equal(refData.field1, testData.field1);
    assert.equal(refData.field2, testData.field2);
    assert.equal(refData.field3, testData.field3);
    assert.deepEqual(refData.field4, testData.field4);
    assert(refData.field5.bit2);
    assert.deepEqual(refData.field5.toArray(), ['bit2']);
    assert(refData.field6.bit2);
    assert(refData.field6.bit9);
    assert.deepEqual(refData.field6.toArray(), ['bit2', 'bit9']);
  });
});

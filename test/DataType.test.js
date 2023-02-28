'use strict';

const assert = require('assert').strict;

const { getDataType } = require('./util');

const DataType = getDataType();

describe('DataType', function() {
  it('instance should have properties [id,shortName,length,toBuffer,fromBuffer,args,defaultValue,isAnalog]', function() {
    const dataType = new DataType(0, 'dummyType', 1, () => Buffer.from([0]), () => 0, 'args1', 'args2');
    assert.equal(dataType.id, 0);
    assert.equal(dataType.shortName, 'dummyType');
    assert.equal(dataType.length, 1);
    assert.equal(dataType.defaultValue, 0);
    assert.equal(dataType.isAnalog, true);
    assert.deepEqual(dataType.args, ['args1', 'args2']);
  });
});

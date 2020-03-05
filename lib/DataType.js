'use strict';

class DataType {

  constructor(id, shortName, length, toBuf, fromBuf, ...args) {
    this.id = id;
    this.shortName = shortName;
    this.length = length;
    this.toBuffer = toBuf;
    this.fromBuffer = fromBuf;
    this.args = args;
    this.defaultValue = this.fromBuffer(Buffer.alloc(Math.ceil(Math.abs(this.length))), 0, false);
  }

  inspect() {
    return this.shortName;
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.shortName;
  }

}

module.exports = DataType;

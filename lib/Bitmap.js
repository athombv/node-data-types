'use strict';

class Bitmap {

  constructor(bytes, bits, setBits) {
    if (!Buffer.isBuffer(bytes) && Number.isFinite(bytes)) bytes = Buffer.alloc(bytes);
    this._buffer = bytes;
    this._fields = bits;
    if (setBits) this.setBits(setBits);

    const properties = this._fields.reduce((res, key, i) => (key ? Object.assign(res, {
      [key]: {
        enumerable: true,
        get: () => {
          return this.getBit(i);
        },
        set: val => {
          return this.setBit(i, val);
        },
      },
    }) : res), {});
    Object.defineProperties(this, properties);
  }

  setBit(i, value = true) {
    const octet = Math.floor(i / 8);
    if (value) {
      this._buffer[octet] |= 1 << (i % 8);
    } else this._buffer[octet] &= (~(1 << (i % 8))) & 0xFF;
  }

  getBit(i) {
    const octet = Math.floor(i / 8);
    return !!(this._buffer[octet] & (1 << (i % 8)));
  }

  clearBit(i) {
    return this.setBit(i, false);
  }

  setBits(bits) {
    if (Number.isFinite(bits) && !Array.isArray(bits)) {
      this._buffer.writeUIntLE(bits, 0, this._buffer.length);
    } else if (Array.isArray(bits)) {
      bits
        .map(v => {
          if (typeof v !== 'string') throw new TypeError(`${v} is an invalid field`);
          const idx = this._fields.indexOf(v);
          if (idx < 0) throw new TypeError(`${v} is an invalid field`);
          return idx;
        })
      // eslint-disable-next-line no-return-assign
        .forEach(v => this._buffer[Math.floor(v / 8)] |= 1 << (v % 8));
    } else {
      throw new Error('not_implemented');
    }
  }

  getBits() {
    const res = [];
    for (let i = 0; i < this._buffer.length; i++) {
      const byte = this._buffer[i];
      for (let j = 0; j < 8; j++) {
        if (byte & (1 << j)) res.push(this._fields[i * 8 + j]);
      }
    }
    return res;
  }

  get length() {
    return this._buffer.length;
  }

  static fromBuffer(buf, i, len, args) {
    i = i || 0;
    return new Bitmap(buf.slice(i, i + len), args);
  }

  static toBuffer(buf, i, length, args, v) {
    i = i || 0;
    buf = buf.slice(i, i + length);
    if (!(v instanceof Bitmap)) {
      v = new Bitmap(buf, args, v);
    }
    return v.toBuffer(buf, 0);
  }

  toArray() {
    return this.getBits();
  }

  toBuffer(buf, i) {
    i = i || 0;
    if (!buf) buf = Buffer.alloc(this._buffer.length);
    return this._buffer.copy(buf, i);
  }

  copy() {
    return new Bitmap(this.length, this._fields, this.getBits());
  }

  toJSON() {
    return this._buffer.toJSON();
  }

  inspect() {
    const res = this.getBits();
    return `Bitmap [ ${res.join(', ')} ]`;
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.inspect();
  }

}

module.exports = Bitmap;

type SetBits = number | string[];
type Bits = string[];
type Bytes = Buffer | number;

export class Bitmap {
  private bytes: Buffer;
  constructor(bytes: Bytes, private bits: Bits, setBits?: SetBits) {
    // Create new Buffer of size bytes if bytes is not already a Buffer
    this.bytes = typeof bytes === 'number' ? Buffer.alloc(bytes) : bytes;

    if (setBits) this.setBits(setBits);

    const properties = this.bits.reduce(
      (res, key, i) =>
        key
          ? Object.assign(res, {
              [key]: {
                enumerable: true,
                get: () => {
                  return this.getBit(i);
                },
                set: (value: boolean) => {
                  return this.setBit(i, value);
                }
              }
            })
          : res,
      {}
    );
    Object.defineProperties(this, properties);
  }

  setBit(index: number, value = true) {
    const octet = Math.floor(index / 8);
    if (value) {
      this.bytes[octet] |= 1 << index % 8;
    } else this.bytes[octet] &= ~(1 << index % 8) & 0xff;
  }

  getBit(index: number) {
    const octet = Math.floor(index / 8);
    return !!(this.bytes[octet] & (1 << index % 8));
  }

  clearBit(index: number) {
    return this.setBit(index, false);
  }

  setBits(bits: SetBits) {
    if (Number.isFinite(bits) && !Array.isArray(bits)) {
      this.bytes.writeUIntLE(bits, 0, this.bytes.length);
    } else if (Array.isArray(bits)) {
      bits
        .map((v) => {
          if (typeof v !== 'string') throw new TypeError(`${v} is an invalid field`);
          const idx = this.bits.indexOf(v);
          if (idx < 0) throw new TypeError(`${v} is an invalid field`);
          return idx;
        })
        // eslint-disable-next-line no-return-assign
        .forEach((v) => (this.bytes[Math.floor(v / 8)] |= 1 << v % 8));
    } else {
      throw new Error('not_implemented');
    }
  }

  getBits() {
    const res = [];
    for (let i = 0; i < this.bytes.length; i++) {
      const byte = this.bytes[i];
      for (let j = 0; j < 8; j++) {
        if (byte & (1 << j)) res.push(this.bits[i * 8 + j]);
      }
    }
    return res;
  }

  get length() {
    return this.bytes.length;
  }

  static fromBuffer(buffer: Buffer, index: number | undefined, length: number, args: Bits) {
    index = index || 0;
    return new Bitmap(buffer.subarray(index, index + length), args);
  }

  static toBuffer(
    buffer: Buffer,
    index: number | undefined,
    length: number,
    args: string[],
    value: Bitmap | SetBits
  ) {
    index = index || 0;
    buffer = buffer.subarray(index, index + length);
    if (!(value instanceof Bitmap)) {
      value = new Bitmap(buffer, args, value);
    }
    return value.toBuffer(buffer, 0);
  }

  toArray() {
    return this.getBits();
  }

  toBuffer(buffer: Buffer | undefined, index: number | undefined) {
    index = index || 0;
    if (!buffer) buffer = Buffer.alloc(this.bytes.length);
    return this.bytes.copy(buffer, index);
  }

  copy() {
    return new Bitmap(this.length, this.bits, this.getBits());
  }

  toJSON() {
    return this.bytes.toJSON();
  }

  inspect() {
    const bits = this.getBits();
    return `Bitmap [ ${bits.join(', ')} ]`;
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.inspect();
  }
}

export class DataType<T> {
  args: unknown[];
  defaultValue: T;

  /**
   * @param {number} id Data type ID as documented in the Zigbee specification.
   * @param {string} shortName Data type name
   * @param {number} length Data type length in bytes
   * @param {function} toBuffer Method that writes the value to the buffer at given offset.
   * @param {function} fromBuffer Method that reads the value from the buffer at given offset,
   *  if required by "returnLength" it will return the length of the read value in bytes.
   * @param {...unknown} args Args are used by enum, map and array types.
   */
  constructor(
    public id: number,
    public shortName: string,
    public length: number,
    /**
     * Returns offset + number of bytes written.
     */
    public toBuffer: (buffer: Buffer, value: unknown, offset: number) => number,
    /**
     * Returns value with type T.
     */
    private _fromBuffer: (
      buffer: Buffer,
      offset: number,
      returnLength?: boolean
    ) => T | { length: number; result: T },

    ...args: any[]
  ) {
    this.args = args;
    this.defaultValue = this.fromBuffer(Buffer.alloc(Math.ceil(Math.abs(this.length))), 0, false);
  }

  /**
   * Method that reads the value from the buffer at given offset, if required by
   * "returnLength" it will return the length of the read value in bytes.
   *
   * The overloads below are needed to properly type the return value of fromBuffer
   * based on the returnLength parameter.
   *
   * @param {Buffer} buffer Buffer to read from.
   * @param {number} offset Offset to starting reading the Buffer at.
   * @param {boolean} [returnLength=false] Optional flag which changes the return value to an object containing the result and lenght of value in bytes.
   * @returns
   */
  public fromBuffer(buffer: Buffer, offset: number): T;
  public fromBuffer(buffer: Buffer, offset: number, returnLength: false): T;
  public fromBuffer(
    buffer: Buffer,
    index: number,
    returnLength: true
  ): { length: number; result: T };
  public fromBuffer(buffer: Buffer, offset: number, returnLength: boolean = false): any {
    // If returnLength is true return object
    if (returnLength) {
      return this._fromBuffer(buffer, offset, returnLength);
    }

    // If returnLength is not true return T
    return this._fromBuffer(buffer, offset);
  }

  /**
   * Return true if data type is an analog type according to the Zigbee specification.
   */
  get isAnalog() {
    // discrete
    // data (8 - 15)
    // bool (16)
    // bitmap (24-31)
    // enum (48-49)
    // string ( 65 - 68)
    // misc ( 248,241)

    // analogue
    // uint (32 - 39)
    // int (40 - 47)
    // semi/single/double (56 - 58)

    // If id is one of the discrete ids
    return !(
      (this.id >= 8 && this.id <= 16) ||
      (this.id >= 24 && this.id <= 31) ||
      (this.id >= 48 && this.id <= 49) ||
      (this.id >= 65 && this.id <= 68) ||
      (this.id >= 240 && this.id <= 241)
    );
  }

  inspect() {
    return this.shortName;
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.shortName;
  }
}

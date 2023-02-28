export class DataType<T> {
  args: unknown[];

  /**
   * @param {number} id
   * @param {string} shortName
   * @param {number} length
   * @param {function} toBuffer
   * @param {function} fromBuffer
   * @param args
   */
  constructor(
    public id: number,
    public shortName: string,
    public length: number,
    /**
     * Returns offset + number of bytes written.
     */
    public toBuffer: (buffer: Buffer, value: unknown, index: number) => number,
    /**
     * Returns value with type T.
     */
    private _fromBuffer: (
      buffer: Buffer,
      index: number,
      returnLength?: boolean
    ) => T | { length: number; result: T },
    public defaultValue: T,
    ...args: any[]
  ) {
    this.args = args;
  }

  // This overload is need to properly type the return value of fromBuffer
  // based on the returnLength parameter
  public fromBuffer(buffer: Buffer, index: number): T;
  public fromBuffer(buffer: Buffer, index: number, returnLength: false): T;
  public fromBuffer(
    buffer: Buffer,
    index: number,
    returnLength: true
  ): { length: number; result: T };
  public fromBuffer(buffer: Buffer, index: number, returnLength: boolean = false): any {
    // If returnLength is true return object
    if (returnLength) {
      return this._fromBuffer(buffer, index, returnLength);
    }

    // If returnLength is not true return T
    return this._fromBuffer(buffer, index);
  }

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

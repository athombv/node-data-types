declare module "@athombv/data-types" {
  class DataType<ToBuffer, FromBuffer = ToBuffer, ToBufferReturn = number> {
    constructor(
      id: number,
      shortName: string,
      length: number,
      toBuffer: (buffer: Buffer, value: ToBuffer, index?: number) => ToBufferReturn,
      fromBuffer: (buffer: Buffer, index?: number) => FromBuffer,
      ...args: Array<unknown>
    );

    id: number;
    shortName: string;
    length: number;
    toBuffer: (buffer: Buffer, value: ToBuffer, index?: number) => ToBufferReturn;
    fromBuffer: (buffer: Buffer, index?: number) => FromBuffer;
    args: Array<unknown>;
    defaultValue: FromBuffer;

    get isAnalog(): boolean;
    inspect(): string;
  }

  const DataTypes: {
    noData: DataType<any, { result:null, length: 0 }, null>

    data8: DataType<number>;
    data16: DataType<number>;
    data24: DataType<number>;
    data32: DataType<number>;
    data40: DataType<Buffer>;
    data48: DataType<Buffer>;
    data56: DataType<Buffer>;
    data64: DataType<Buffer>;

    bool: DataType<boolean | null>;

    map8: <Flags extends string | null>(...flags: Array<Flags>) => DataType<Bitmap<Flags>>;
    map16: <Flags extends string | null>(...flags: Array<Flags>) => DataType<Bitmap<Flags>>;
    map24: <Flags extends string | null>(...flags: Array<Flags>) => DataType<Bitmap<Flags>>;
    map32: <Flags extends string | null>(...flags: Array<Flags>) => DataType<Bitmap<Flags>>;
    map40: <Flags extends string | null>(...flags: Array<Flags>) => DataType<Bitmap<Flags>>;
    map48: <Flags extends string | null>(...flags: Array<Flags>) => DataType<Bitmap<Flags>>;
    map56: <Flags extends string | null>(...flags: Array<Flags>) => DataType<Bitmap<Flags>>;
    map64: <Flags extends string | null>(...flags: Array<Flags>) => DataType<Bitmap<Flags>>;

    uint8: DataType<number>;
    uint16: DataType<number>;
    uint24: DataType<number>;
    uint32: DataType<number>;
    uint40: DataType<number>;
    uint48: DataType<number>;
    // uint56: DataType<number>,
    // uint64: DataType<number>,

    int8: DataType<number>;
    int16: DataType<number>;
    int24: DataType<number>;
    int32: DataType<number>;
    int40: DataType<number>;
    int48: DataType<number>;
    // int56: DataType<number>,
    // int64: DataType<number>,

    enum8: <Flags extends string | number | undefined>(flags: Record<Flags, number>) => DataType<Exclude<Flags, undefined>, Flags>;
    enum16: <Flags extends string | number | undefined>(flags: Record<Flags, number>) => DataType<Exclude<Flags, undefined>, Flags>;
    enum32: <Flags extends string | number | undefined>(flags: Record<Flags, number>) => DataType<Exclude<Flags, undefined>, Flags>;

    // semi: DataType<number>,
    single: DataType<number>;
    double: DataType<number>;

    octstr: DataType<Buffer>;
    string: DataType<string>;
    // octstr16: DataType<string>,
    // string16: DataType<string>,

    // array
    // struct
    // set
    // bag

    // ToD
    // date
    // UTC

    // clusterId
    // attribId

    // bacOID
    EUI48: DataType<string>;
    EUI64: DataType<string>;
    key128: DataType<string>;

    //* Internal Types *//
    map4: <Flags extends string | null>(...flags: Array<Flags>) => DataType<Bitmap<Flags>>;
    uint4: DataType<number>;
    enum4: <Flags extends string | number | undefined>(flags: Record<Flags, number>) => DataType<Exclude<Flags, undefined>, Flags>;

    buffer: DataType<Buffer>;
    buffer8: DataType<Buffer>;
    buffer16: DataType<Buffer>;

    Array0: {
      <T>(type: DataType<T>): DataType<Array<T>>;
      // Overload to allow structs in arrays
      <Defs extends Record<string, StructField>>(
        type: StaticStruct<Defs>,
      ): DataType<Array<StructProperties<Defs>>>;
    };
    Array8: {
      <T>(type: DataType<T>): DataType<Array<T>>;
      // Overload to allow structs in arrays
      <Defs extends Record<string, StructField>>(
        type: StaticStruct<Defs>,
      ): DataType<Array<StructProperties<Defs>>>;
    };
    FixedString: (length: number) => DataType<string>;
  };

  type Bitmap<Flags extends string | null> = BitmapBase<Flags> & {
    [K in Flags as K extends string ? K : never]: boolean;
  };

  class BitmapBase<Flags extends string | null> {
    _buffer: Buffer;
    _fields: Array<Flags>;
    setBit(index: number, value?: boolean): void;
    getBit(index: number): boolean;
    clearBit(index: number): void;
    setBits(bits: number | Array<Flags>): void;
    getBits(): Array<Flags>;
    get length(): number;
    static fromBuffer<Flags extends string | null>(
      buffer: Buffer,
      index: number,
      length: number,
      flags: Array<Flags>,
    ): Bitmap<Flags>;
    static toBuffer<Flags extends string | null>(
      buffer: Buffer,
      index: number,
      length: number,
      flags: Array<Flags>,
      value: number,
    ): number;
    static toBuffer<Flags extends string | null>(
      buffer: Buffer,
      index: number,
      length: number,
      flags: Array<Flags> | undefined,
      value: Bitmap<Flags>,
    ): number;
    toArray(): Array<Flags>;
    toBuffer(buffer: Buffer, index: number): Buffer;
    copy(): Bitmap<Flags>;
    toJSON(): object;
    inspect(): string;
  }

  type StructField = DataType<any, any, any> | StaticStruct<any>;

  interface StaticStruct<Defs extends Record<string, StructField>> {
    get fields(): Defs;
    get name(): string;
    get length(): number;
    fromJSON(props: any): StructInstance<Defs>;
    fromArgs(...args: Array<unknown>): StructInstance<Defs>;
    fromBuffer(buffer: Buffer, index?: number, returnLength?: false): StructInstance<Defs>;
    fromBuffer(
      buffer: Buffer,
      index?: number,
      returnLength?: true,
    ): {
      result: StructInstance<Defs>;
      length: number;
    };
    toBuffer(buffer?: Buffer, value?: StructProperties<Defs>, index?: number): number;
  }

  type StructProperties<Defs extends Record<string, StructField>> = {
    [Property in keyof Defs]: Defs[Property] extends DataType<infer ToBuffer, infer FromBuffer, any>
      ? FromBuffer
      : Defs[Property] extends StaticStruct<infer InnerDefs extends Record<string, StructField>>
        ? StructProperties<InnerDefs>
        : never;
  };

  type StructInstance<Defs extends Record<string, StructField>> = StructProperties<Defs> & {
    toJSON: () => StructProperties<Defs>;
    toBuffer: (buffer?: Buffer, index?: number) => Buffer;
  };

  function Struct<Defs extends Record<string, StructField>>(
    name: string,
    defs: Defs,
    opts?: { encodeMissingFieldsBehavior?: "default" | "skip" },
  ): StaticStruct<Defs>;
}

/*
How to use @athombv/data-types in TypeScript:

// Create a Struct instance
const ZdoEndDeviceAnnounceIndicationStruct = Struct("ZdoEndDeviceAnnounceIndication", {
  srcAddr: DataTypes.uint16,
  IEEEAddr: DataTypes.EUI64,
});

// Create ZdoEndDeviceAnnounceIndication object from a buffer
const ZdoEndDeviceAnnounceObject = ZdoEndDeviceAnnounceIndicationStruct.fromBuffer(
  Buffer.from([0, 1, 2, 3])
);

// @ts-expect-error srcAddr is not a string
ZdoEndDeviceAnnounceObject.srcAddr.trim();

// Create Buffer instance from ZdoEndDeviceAnnounceObject
const ZdoEndDeviceAnnounceBuffer = Buffer.alloc(8);
// @ts-expect-error typo in IEEEAddr name
ZdoEndDeviceAnnounceIndicationStruct.toBuffer(ZdoEndDeviceAnnounceBuffer, { srcAddr: 1, IEEAddr: 'abc' });

const Item = Struct('Item', { a: DataTypes.uint8, b: DataTypes.uint8 });
const ArrayOfItems = DataTypes.Array8(Item);

Known limitation: Struct.fromArgs cannot be typed.
*/

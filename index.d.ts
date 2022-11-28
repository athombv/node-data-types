interface StructInstance<StructType> {
  fromBuffer: (buffer: Buffer) => StructType;
  toBuffer: (object: StructType, index?: number) => Buffer;
}

declare module "@athombv/data-types" {
  const DataTypes: any;
  const Struct: <StructType>(name: string, objectDefinition: StructType) => StructInstance<StructType>;

  export { DataTypes, Struct };
}

/*
How to use @athombv/data-types in TypeScript:

// Create a type that represents the Struct data
type ZdoEndDeviceAnnounceIndication = {
  srcAddr: number;
  IEEEAddr: string;
};

// Create a Struct instance with generic type ZdoEndDeviceAnnounceIndication
const ZdoEndDeviceAnnounceIndicationStruct =
  Struct<ZdoEndDeviceAnnounceIndication>("ZdoEndDeviceAnnounceIndication", {
    srcAddr: DataTypes.uint16,
    IEEEAddr: DataTypes.EUI64,
  });

// Create ZdoEndDeviceAnnounceIndication object
const ZdoEndDeviceAnnounceObject = ZdoEndDeviceAnnounceIndicationStruct.fromBuffer(
  Buffer.from([0, 1, 2, 3])
);

ZdoEndDeviceAnnounceObject.srcAddr.trim(); // This errors, srcAddr is not a string

// Create Buffer instance from ZdoEndDeviceAnnounceObject
const ZdoEndDeviceAnnounceBuffer = ZdoEndDeviceAnnounceIndicationStruct.toBuffer({ srcAddr: 1, IEEAddr: 'abc' }); // This errors due to typo in IEEEAddr name
*/

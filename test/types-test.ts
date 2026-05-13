/**
 * Type-level regression tests for @athombv/data-types.
 *
 * This file is NEVER EXECUTED. It is type-checked only, via `npm run typecheck`.
 * It validates the public contract in index.d.ts using two techniques:
 *
 *   1. Positive assertions:  `const x: ExpectedType = someValue`
 *      Fails to compile if `someValue` is not assignable to `ExpectedType`.
 *
 *   2. Negative assertions:  `// @ts-expect-error` above an expression
 *      Fails to compile ("Unused '@ts-expect-error' directive") if the
 *      expression no longer produces a type error.
 *
 * When a change makes a directive "unused", you must decide:
 *   - Intentional fix  -> delete the directive.
 *   - Accidental loosening -> revert the change.
 *
 * Unused local bindings are fine - this file only exists for its side effect
 * on the type checker.
 */

import { DataType, Struct, DataTypes } from "@athombv/data-types";

// ---------------------------------------------------------------------------
// Helper - reduces boilerplate when we only care about the parsed struct type
// ---------------------------------------------------------------------------

const emptyBuf = (size = 64) => Buffer.alloc(size);

// ===========================================================================
// 1. Primitive DataType value types
// ---------------------------------------------------------------------------
// Regressions here silently change what consumers read from a buffer. Each
// assertion pins the expected value type.
// ===========================================================================

// Integers - all return number
const ints = Struct("Ints", {
  u8: DataTypes.uint8,
  u16: DataTypes.uint16,
  u32: DataTypes.uint32,
  i8: DataTypes.int8,
  i32: DataTypes.int32,
  u4: DataTypes.uint4,
  sng: DataTypes.single,
  dbl: DataTypes.double,
}).fromBuffer(emptyBuf());
const _intU8: number = ints.u8;
const _intU16: number = ints.u16;
const _intU32: number = ints.u32;
const _intI8: number = ints.i8;
const _intI32: number = ints.i32;
const _intU4: number = ints.u4;
const _intSng: number = ints.sng;
const _intDbl: number = ints.dbl;

// data8..data64 return Buffer (NOT number - corrected in this PR)
const datas = Struct("Datas", {
  d8: DataTypes.data8,
  d16: DataTypes.data16,
  d64: DataTypes.data64,
}).fromBuffer(emptyBuf());
const _dataD8: number = datas.d8;
const _dataD16: number = datas.d16;
const _dataD64: Buffer = datas.d64;
// @ts-expect-error data64 is Buffer, not number
const _dataD64Wrong: number = datas.d64;

// octstr returns Buffer, string returns string (octstr was incorrectly typed as string before)
const strs = Struct("Strs", {
  oct: DataTypes.octstr,
  utf: DataTypes.string,
  fixed: DataTypes.FixedString(8),
}).fromBuffer(emptyBuf());
const _strOct: Buffer = strs.oct;
const _strUtf: string = strs.utf;
const _strFixed: string = strs.fixed;
// @ts-expect-error octstr is Buffer, not string
const _strOctWrong: string = strs.oct;

// bool returns boolean | null (was incorrectly `boolean` before - 0xff means null at runtime)
const bools = Struct("Bools", { b: DataTypes.bool }).fromBuffer(emptyBuf());
const _bool: boolean | null = bools.b;
// @ts-expect-error bool can be null, plain boolean is too narrow
const _boolWrong: boolean = bools.b;

DataTypes.bool.toBuffer(emptyBuf(), true);
DataTypes.bool.toBuffer(emptyBuf(), null);
// @ts-expect-error bool written to buffer must be boolean or null
DataTypes.bool.toBuffer(emptyBuf(), 1);

// EUI addresses / keys return string (hex-formatted)
const addrs = Struct("Addrs", {
  e48: DataTypes.EUI48,
  e64: DataTypes.EUI64,
  k: DataTypes.key128,
}).fromBuffer(emptyBuf());
const _addrE48: string = addrs.e48;
const _addrE64: string = addrs.e64;
const _addrKey: string = addrs.k;

// Length-prefixed buffers
const bufs = Struct("Bufs", {
  b: DataTypes.buffer,
  b8: DataTypes.buffer8,
  b16: DataTypes.buffer16,
}).fromBuffer(emptyBuf());
const _bufPlain: Buffer = bufs.b;
const _buf8: Buffer = bufs.b8;
const _buf16: Buffer = bufs.b16;

// noData always returns { result:null, length: 0 }
const none = Struct("None", { n: DataTypes.noData }).fromBuffer(emptyBuf());
const _noData: null = none.n.result;
// @ts-expect-error noData.fromBuffer always returns an object
const _wrongNoData: null = DataTypes.noData.fromBuffer(emptyBuf());

const normalToBufferReturn: number = DataTypes.bool.toBuffer(emptyBuf(), true);
// @ts-expect-error toBuffer normally returns number
const wrongNormalToBufferReturn: null = DataTypes.bool.toBuffer(emptyBuf(), true);

const _noDataToBufferReturn: null = DataTypes.noData.toBuffer(emptyBuf(), "anything")
// @ts-expect-error noData.toBuffer returns null
const _wrongNoDataToBufferReturn: number = DataTypes.noData.toBuffer(emptyBuf(), "anything")

// ===========================================================================
// 2. Enum narrowing
// ---------------------------------------------------------------------------
// Enum value types narrow to the literal union of the provided keys, so
// `if (value === "UNKNOWN")` is caught as a typo.
// ===========================================================================

const Mode = DataTypes.enum8({ OFF: 0, ON: 1, AUTO: 2 });
const mode = Struct("Mode", { m: Mode }).fromBuffer(emptyBuf(1));
const _mode: "OFF" | "ON" | "AUTO" = mode.m;

// Comparing to a declared enum value is fine.
if (mode.m === "ON") {
  /* reachable */
}
// @ts-expect-error "UNKNOWN" is not one of the declared keys
if (mode.m === "UNKNOWN") {
  /* unreachable */
}

// enum4 narrows the same way (4-bit variant).
const Half = DataTypes.enum4({ LO: 0, HI: 1 });
const half = Struct("Half", { h: Half, _pad: DataTypes.uint4 }).fromBuffer(emptyBuf(1));
const _half: "LO" | "HI" = half.h;
// @ts-expect-error value should be part of the enum
const _halfWrong: "Wrong" = half.h;
const _halfDefault: "LO" | "HI" = Half.defaultValue;
// @ts-expect-error default value should be part of the enum
const _halfDefaultWrong: "Wrong" = Half.defaultValue;

// Numeric keys are supported (new in this PR). Object literal numeric keys
// become strings at runtime, but the type allows either.
const Status = DataTypes.enum8({ 0x00: 0, 0x01: 1, 0x80: 2 });
const statusEnum = Struct("StatusEnum", { s: Status }).fromBuffer(emptyBuf(1));
const _statusVal = statusEnum.s; // type: "0" | "1" | "128" or similar

// It could occur that a device returns a value outside of the enum.
// In this case fromBuffer returns undefined.
const UndefinedEnum = DataTypes.enum4<"Valid" | 1 | undefined>({Valid: 0, 1: 1})
const undefinedEnum = Struct("Undefined", {enum: UndefinedEnum}).fromBuffer(emptyBuf());
const undefinedEnumFromBuffer: 1 | "Valid" | undefined = undefinedEnum.enum;
// @ts-expect-error enum value could be undefined
const undefinedEnumFromBufferWrong: 1 | "Valid" = undefinedEnum.enum;
// @ts-expect-error undefined enum value cannot be written to buffer
UndefinedEnum.toBuffer(emptyBuf(), undefined);
const undefinedEnumDefault : 1 | "Valid" | undefined = UndefinedEnum.defaultValue
// @ts-expect-error default enum value could be undefined
const undefinedEnumDefaultWrong : 1 | "Valid" = UndefinedEnum.defaultValue

// ===========================================================================
// 3. Bitmap (via mapN)
// ---------------------------------------------------------------------------
// Each declared flag becomes a named boolean property. null padding is
// filtered out. Inherited methods from BitmapBase are available.
// ===========================================================================

const StatusBitmap = DataTypes.map8("online", "lowBattery", "tampered");
const status = StatusBitmap.fromBuffer(Buffer.from([0b00000101]), 0);

// Named flag properties are typed as boolean.
const _flagOnline: boolean = status.online;
status.lowBattery = true;
// @ts-expect-error unknown flag
status.notAFlag;

// Inherited methods still work.
status.setBit(0, true);
const _bit: boolean = status.getBit(0);
const _allSet = status.getBits(); // returns Array of the declared flag union

// null slots in a mapN are omitted from the type (runtime ignores them too).
const Capabilities = DataTypes.map8(
  "alternatePANCoordinator",
  "deviceType",
  "powerSourceMains",
  "receiveWhenIdle",
  null,
  null,
  "security",
  "allocateAddress",
);
const caps = Capabilities.fromBuffer(emptyBuf(1));
const _cap: boolean = caps.security;
// @ts-expect-error "null" is not a valid property - null slots are filtered out
caps.null;

// ===========================================================================
// 4. Struct basics - create, read, write, typo detection
// ===========================================================================

const ZdoEndDeviceAnnounce = Struct("ZdoEndDeviceAnnounce", {
  srcAddr: DataTypes.uint16,
  IEEEAddr: DataTypes.EUI64,
});

// Reading narrows field types.
const zdo = ZdoEndDeviceAnnounce.fromBuffer(Buffer.from([0, 1, 2, 3]));
const _zdoSrc: number = zdo.srcAddr;
const _zdoIeee: string = zdo.IEEEAddr;
// @ts-expect-error srcAddr is number, not string
zdo.srcAddr.trim();

// Writing accepts a plain object (not just a StructInstance).
const zdoBuf = Buffer.alloc(8);
ZdoEndDeviceAnnounce.toBuffer(zdoBuf, { srcAddr: 1, IEEEAddr: "abc" });

// Typos in field names are rejected on write.
ZdoEndDeviceAnnounce.toBuffer(zdoBuf, {
  srcAddr: 1,
  // @ts-expect-error typo in IEEEAddr
  IEEAddr: "abc",
});

// Wrong field types are rejected.
ZdoEndDeviceAnnounce.toBuffer(zdoBuf, {
  // @ts-expect-error srcAddr must be number
  srcAddr: "nope",
  IEEEAddr: "abc",
});

// Instance helpers on the returned object.
const _zdoJson = zdo.toJSON();
const _zdoJsonSrc: number = _zdoJson.srcAddr;
const _zdoWrite: Buffer = zdo.toBuffer();
const _zdoWriteWithBuf: Buffer = zdo.toBuffer(Buffer.alloc(10), 0);

// ===========================================================================
// 5. Nested structs and arrays
// ---------------------------------------------------------------------------
// Regression coverage for "Structs in Structs" and "Array of Structs"
// patterns (the former was listed as a limitation before this PR).
// ===========================================================================

const NetworkAddress = Struct("NetworkAddress", {
  short: DataTypes.uint16,
  ieee: DataTypes.EUI64,
});

const Endpoint = Struct("Endpoint", {
  id: DataTypes.uint8,
  profileId: DataTypes.uint16,
  inputClusters: DataTypes.Array8(DataTypes.uint16),
});

const Device = Struct("Device", {
  version: DataTypes.uint8,
  address: NetworkAddress, // Struct-in-Struct
  capabilities: Capabilities, // Bitmap field
  supportedChannels: DataTypes.Array8(DataTypes.uint8), // Array of primitives
  endpoints: DataTypes.Array8(Endpoint), // Array of Structs
  // Triple nesting: Struct in Struct in Struct
  gateway: Struct("Gateway", {
    uplink: NetworkAddress,
    downlink: NetworkAddress,
  }),
});

const device = Device.fromBuffer(emptyBuf(256));

// Field access narrows through every level.
const _devVer: number = device.version;
const _devShort: number = device.address.short;
const _devIeee: string = device.address.ieee;
const _devCap: boolean = device.capabilities.alternatePANCoordinator;
const _devCh: number = device.supportedChannels[0];
const _devEpId: number = device.endpoints[0].id;
const _devEpCluster: number = device.endpoints[0].inputClusters[0];
const _devGwIeee: string = device.gateway.uplink.ieee;

// Typos are caught at every nesting level.
// @ts-expect-error typo at level 1
device.versoin;
// @ts-expect-error typo inside nested struct
device.address.shrt;
// @ts-expect-error typo inside array element
device.endpoints[0].profIleId;
// @ts-expect-error typo in triple-nested field
device.gateway.uplink.ie;

// Wrong types caught at every level.
// @ts-expect-error number to string
const _wrongVer: string = device.version;
// @ts-expect-error nested number to string
const _wrongShort: string = device.address.short;

// Writing accepts plain objects all the way down.
Device.toBuffer(emptyBuf(256), {
  version: 1,
  address: { short: 0xabcd, ieee: "00:11:22:33:44:55:66:77" },
  capabilities: caps, // Bitmap field requires a Bitmap instance at runtime
  supportedChannels: [11, 15, 20, 25],
  endpoints: [{ id: 1, profileId: 0x0104, inputClusters: [0, 6, 8] }],
  gateway: {
    uplink: { short: 0, ieee: "00:00:00:00:00:00:00:01" },
    downlink: { short: 1, ieee: "00:00:00:00:00:00:00:02" },
  },
});

// Wrong type at any nesting level is rejected.
Device.toBuffer(emptyBuf(256), {
  // @ts-expect-error wrong type for version
  version: "not a number",
  address: { short: 0, ieee: "" },
  capabilities: caps,
  supportedChannels: [],
  endpoints: [],
  gateway: {
    uplink: { short: 0, ieee: "" },
    downlink: { short: 0, ieee: "" },
  },
});

// ===========================================================================
// 6. fromBuffer returnLength overload
// ---------------------------------------------------------------------------
// When returnLength: true, the call returns `{ result, length }`.
// When omitted or false, it returns the result directly.
// ===========================================================================

const withLen = ZdoEndDeviceAnnounce.fromBuffer(emptyBuf(10), 0, true);
const _withLenLen: number = withLen.length;
const _withLenSrc: number = withLen.result.srcAddr;

const direct = ZdoEndDeviceAnnounce.fromBuffer(emptyBuf(10), 0);
const _directSrc: number = direct.srcAddr;
// @ts-expect-error direct result is the struct, no .length wrapper
const _directLen: number = direct.length;

// ===========================================================================
// 7. StaticStruct metadata
// ===========================================================================

const _staticFields = ZdoEndDeviceAnnounce.fields;
const _staticName: string = ZdoEndDeviceAnnounce.name;
const _staticLen: number = ZdoEndDeviceAnnounce.length;

// ===========================================================================
// 8. encodeMissingFieldsBehavior option
// ===========================================================================

Struct("Opt1", { a: DataTypes.uint8 }, { encodeMissingFieldsBehavior: "skip" });
Struct("Opt2", { a: DataTypes.uint8 }, { encodeMissingFieldsBehavior: "default" });
// @ts-expect-error only "skip" or "default" is allowed
Struct("OptBad", { a: DataTypes.uint8 }, { encodeMissingFieldsBehavior: "foo" });

// ===========================================================================
// 9. Custom DataType via exposed constructor
// ---------------------------------------------------------------------------
// The DataType class constructor is now exposed so consumers can define
// their own types.
// ===========================================================================

const Uint16LE = new DataType<number>(
  0xff,
  "uint16LE",
  2,
  (buf, value, i) => buf.writeUInt16LE(value, i ?? 0),
  (buf, i) => buf.readUInt16LE(i ?? 0),
);
const customStruct = Struct("Custom", { v: Uint16LE }).fromBuffer(emptyBuf(2));
const _customV: number = customStruct.v;

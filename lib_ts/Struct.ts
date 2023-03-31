import { DataType } from './DataType';
import { isStringArray, isNumberArray } from './Util';

type StructDefinition = { [key: string]: DataType<unknown> };

// Get generic type from each DataType instance in this struct definition
type StructDataTypesFromDefinition<T extends StructDefinition> = {
  [K in keyof T]: T[K] extends DataType<infer U> ? U : never;
};

// Allowed types of data in a struct
type StructData = Record<string, number | boolean | string | string[] | number[] | Buffer>;

/**
 * Calculate size of struct in bytes.
 * @param {StructDefinition} structDefinition
 */
function getStructSize(structDefinition: StructDefinition) {
  let size = 0;
  let varsize = false;

  // Loop all data types in this definition
  for (const dataType of Object.values(structDefinition)) {
    // If length of data type is number and bigger than zero add it to size
    if (typeof dataType.length === 'number' && dataType.length > 0) {
      size += dataType.length;
    } else {
      // If not a number or negative this struct has a variable size
      varsize = true;
    }
  }

  return {
    size,
    varsize
  };
}

/**
 * Type guard that checks for valid struct data object.
 * @param value
 * @returns
 */
function isStructData(value: unknown): value is StructData {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).every(
      (value) =>
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'string' ||
        isStringArray(value) ||
        isNumberArray(value)
    )
  );
}

/**
 * Function that returns the class StructClass.
 * @param {string} name Name of struct
 * @param {StructDefinition} structDefinition Definition of struct, an object with DataTypes.
 */
export function Struct<T extends StructDefinition>(name: string, structDefinition: T) {
  // Determine size of struct (and if size is variable)
  const { size, varsize } = getStructSize(structDefinition);

  // Seal the definition
  Object.seal(structDefinition);

  // Create type for static fromBuffer
  type StructDataDefaultTypes = StructDataTypesFromDefinition<T>;

  // Infer from the struct definition the struct type
  // For example: { propOne: DataType.uint8, propTwo: DataType.string }
  // becomes { propOne: number, propTwo: string }.
  return class StructClass {
    constructor(public structData: StructData) {
      for (const key in structData) {
        if (!structDefinition[key]) {
          throw new TypeError(`${this.constructor.name}: ${key} is an unexpected property`);
        }
        // @ts-expect-error
        this[key] = structData[key];
      }
      for (const key in structDefinition) {
        if (typeof structData[key] === 'undefined') {
          // @ts-expect-error
          this[key] = structDefinition[key].defaultValue;
        }
      }
    }

    toBuffer(buffer?: Buffer, index: number = 0): Buffer {
      let length = 0;

      if (varsize && !buffer) {
        buffer = Buffer.alloc(size + 255); // TODO: fix my size
      } else if (!buffer) {
        buffer = Buffer.alloc(size);
      }

      // TODO: clean this up
      for (const [key, value] of Object.entries(structDefinition)) {
        let _varsize = structDefinition[key].length;
        const dataTypeInstance = structDefinition[key];

        if (_varsize <= 0) {
          const rBuf = dataTypeInstance.toBuffer(buffer, this.structData[key], index + length);
          // eslint-disable-next-line no-nested-ternary
          _varsize = Number.isFinite(rBuf) ? rBuf : Buffer.isBuffer(rBuf) ? rBuf.length : 0;
        } else {
          dataTypeInstance.toBuffer(buffer, this.structData[key], index + length);
        }
        length += _varsize;
      }

      return buffer.subarray(index, index + length);
    }

    // TODO: illegal to use static name/length on a class in TS
    // static get length() {
    //   return varsize ? -size : size;
    // }

    // TODO: illegal to use static name/length on a class in TS
    // static get name() {
    //   return name;
    // }

    static get fields() {
      return structDefinition;
    }

    static toBuffer(buffer: Buffer, value: unknown, index: number) {
      // If value is not yet a StructClass make it so
      if (!(value instanceof StructClass)) {
        // Check if value is struct data (object with valid values)
        if (!isStructData(value)) {
          throw new TypeError('Expected Struct instance or data');
        }

        // Create new StructClass instance from provided struct data
        value = new this(value);
      }

      // Validate value is now instance of StructClass
      if (!(value instanceof StructClass)) throw new TypeError('Expected Struct instance');
      return value.toBuffer(buffer, index);
    }

    // Overloading here is necessary due to return type that depends on
    // returnLength being true or not.
    static fromBuffer(buffer: Buffer, index?: number): StructDataDefaultTypes;
    static fromBuffer(buffer: Buffer, index?: number, returnLength?: false): StructDataDefaultTypes;
    static fromBuffer(
      buffer: Buffer,
      index?: number,
      returnLength?: true
    ): { result: StructDataDefaultTypes; length: number };
    static fromBuffer(
      buffer: Buffer,
      index: number = 0,
      returnLength: boolean = false
    ): StructDataDefaultTypes | { result: StructDataDefaultTypes; length: number } {
      // Length cursor used for reading multiple DataTypes from the buffer
      let length = 0;

      // Result object will be the inferred struct type:
      // { booleanProp: DataType<boolean> } -> { booleanProp: boolean }
      const result:
        | StructDataTypesFromDefinition<typeof structDefinition>
        | Record<string, unknown> = {};

      // Loop the struct definition ({ booleanProp: DataType<boolean> })
      for (const [key, dataTypeInstance] of Object.entries(structDefinition)) {
        // If DataType has positive length call fromBuffer and add the length of
        // the DataType to the length cursor.
        if (dataTypeInstance.length > 0) {
          result[key] = dataTypeInstance.fromBuffer(buffer, index + length);
          length += dataTypeInstance.length;
        } else {
          // If DataType has negative or zero length it means it has a variable length
          const entry = dataTypeInstance.fromBuffer(
            buffer.subarray(index, index + buffer.length - (size - length)),
            length,
            true
          );
          result[key] = entry.result;
          length += entry.length;
        }
      }

      // Now we can safely assume result is of type derived from struct definition
      if (returnLength && varsize) {
        return {
          length: index,
          result: result as StructDataDefaultTypes
        };
      }
      return result as StructDataDefaultTypes;
    }
  };
}

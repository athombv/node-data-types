import Debug from 'debug';

import { DataType } from './DataType';
import { isStringArray, isNumberArray } from './Util';

const debug = Debug('Struct');

export type RecursiveStructDefinition = {
  [key: string]: RecursiveStructDefinition | DataType<unknown> | Record<string, DataType<unknown>>;
};

// Alternatively, you can define it explicitly as a type alias
// type RecursiveObject = Record<string, RecursiveObject | number>;

// type StructDefinition = { [key: string]: DataType<unknown> | Record<string, DataType<unknown>> };
export type StructDefinition = Record<
  string,
  DataType<unknown> | Record<string, DataType<unknown>>
>;
// type NestedStructData = Record<string, StructDataTypes | StructDataItem>;
// type NestedStructDefinition = Record<string, DataType<unknown> | NestedStructData>;

// type StructDefinition = NestedStructDefinition;

// Get generic type from each DataType instance in this struct definition
type StructDataTypesFromDefinition<T> = {
  [K in keyof T]: T[K] extends DataType<infer U>
    ? U
    : T[K] extends object
    ? StructDataTypesFromDefinition<T[K]> // Recursive call for nested Structs
    : never;
};

// Example usage
// type StructDefinition = {
//   field1: DataType<number>;
//   field2: DataType<string>;
//   field3: {
//     nestedField: DataType<boolean>;
//     nestedStruct: {
//       bla: DataType<number>;
//     };
//   };
// };

// type ExtractedTypes = StructDataTypesFromDefinition<StructDefinition>;

// let a: ExtractedTypes = { field3: { nestedStruct: { bla: 1 } } };
// a.field3.nestedStruct.bla;

// Allowed types of data in a struct
type StructDataTypes = number | boolean | string | string[] | number[] | Buffer;
type StructDataItem = Record<string, StructDataTypes | Record<string, StructDataTypes>>;
// type StructData = Record<string, StructDataTypes | Record<string, StructDataTypes>>;
// export type StructData = Record<string, StructDataTypes | StructDataItem>;
export type StructData = Record<string, StructDataTypes | StructDataItem>;

/**
 * Calculate size of struct in bytes. TODO: test this
 *
 * @param {RecursiveStructDefinition} structDefinition
 */
export function getStructSize(structDefinition: RecursiveStructDefinition): {
  size: number;
  varsize: boolean;
} {
  let size = 0;
  let varsize = false;

  // Loop all data types in this definition
  for (const value of Object.values(structDefinition)) {
    if (value instanceof DataType) {
      // If length of data type is number and bigger than zero add it to size
      if (typeof value.length === 'number' && value.length > 0) {
        size += value.length;
      } else {
        // If not a number or negative this struct has a variable size
        varsize = true;
      }
    } else {
      // make sure to handle recursive Structs
      const nestedStructSize = getStructSize(value);
      size += nestedStructSize.size;
      varsize = varsize || nestedStructSize.varsize;
    }
  }

  return {
    size,
    varsize
  };
}

/**
 * Type guard that checks for valid struct data object.
 *
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

function filterDataTypeKeys(obj: RecursiveStructDefinition): string[] {
  const result: string[] = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (value instanceof DataType) {
        result.push(key);
      } else if (typeof value === 'object') {
        const childKeys = filterDataTypeKeys(value as RecursiveStructDefinition);
        if (childKeys.length > 0) {
          result.push(key);
          result.push(...childKeys.map((childKey) => `${key}.${childKey}`));
        }
      }
    }
  }

  return result;
}

function getAllKeys(obj: Record<string, unknown>): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);

      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        keys.push(
          ...getAllKeys(value as Record<string, unknown>).map((nestedKey) => `${key}.${nestedKey}`)
        );
      }
    }
  }

  return keys;
}

// TODO: fix compare
export function compareKeys(structObject: StructData, structDefinition: RecursiveStructDefinition) {
  // const objectKeys = Object.keys(structObject);
  // // const definitionKeys = Object.keys(structDefinition);
  // const definitionKeys = Object.entries(structDefinition)
  //   .filter(([key, value]) => {
  //     return (
  //       value instanceof DataType ||
  //       (typeof value === 'object' && Object.values(value).every((x) => x instanceof DataType)) ||
  //       (typeof value === 'object' &&
  //         Object.values(value).every(
  //           (x) => x instanceof DataType || Object.values(x).every((y) => y instanceof DataType)
  //         ))
  //     );
  //   })
  //   .map(([key, value]) => {
  //     return key;
  //   });
  // // Check if all definition keys exist in the object
  // for (const key of definitionKeys) {
  //   if (!objectKeys.includes(key)) {
  //     debug('!objectKeys.includes(key)', definitionKeys, objectKeys, key);
  //     throw new Error('');
  //   }
  // }
  // // Check nested objects recursively
  // for (const key in structDefinition) {
  //   const definitionValue = structDefinition[key];
  //   const objectValue = structObject[key];
  //   // Verify nested objects if both definition and object values are objects
  //   if (typeof definitionValue === 'object' && typeof objectValue === 'object') {
  //     compareKeys(objectValue as StructData, definitionValue as RecursiveStructDefinition);
  //   }
  // }
}

// export function compareKeys(structData: StructData, structDefinition: RecursiveStructDefinition) {
//   const dataKeys = getAllKeys(structData);
//   // const definitionKeys = Object.keys(structDefinition);
//   // const definitionKeys = Object.entries(structDefinition)
//   //   .filter(([key, value]) => {
//   //     return (
//   //       value instanceof DataType ||
//   //       (typeof value === 'object' && Object.values(value).every((x) => x instanceof DataType)) ||
//   //       (typeof value === 'object' &&
//   //         Object.values(value).every(
//   //           (x) => x instanceof DataType || Object.values(x).every((y) => y instanceof DataType)
//   //         ))
//   //     );
//   //   })
//   //   .map(([key, value]) => {
//   //     return key;
//   //   });

//   const dataKeysSet = new Set(dataKeys);
//   const definitionKeysSet = new Set(definitionKeys);

//   debug('compare definition', definitionKeys, 'with data', dataKeys);

//   // Find keys present in structData but not in structDefinition
//   const missingKeysInDefinition = [...dataKeysSet].filter((key) => !definitionKeysSet.has(key));

//   // Find keys present in structDefinition but not in structData
//   const missingKeysInData = [...definitionKeysSet].filter((key) => !dataKeysSet.has(key));

//   // Find unknown keys present in structData
//   const unknownKeysInData = [...dataKeysSet].filter((key) => !definitionKeysSet.has(key));

//   if (unknownKeysInData.length > 0) {
//     throw new Error(
//       `Keys found in structData that are not in structDefinition: ${missingKeysInDefinition.join(
//         ', '
//       )}`
//     );
//   }

//   if (missingKeysInDefinition.length > 0) {
//     throw new Error(
//       `Keys mismatch between structData and structDefinition.\n` +
//         `Missing keys in structDefinition: ${missingKeysInDefinition.join(', ')}`
//     );
//   }

//   if (missingKeysInData.length > 0) {
//     throw new Error(
//       `Keys mismatch between structData and structDefinition.\n` +
//         `Missing keys in structData: ${missingKeysInData.join(', ')}`
//     );
//   }

//   for (const key of dataKeys) {
//     const dataValue = structData[key];
//     const definitionValue = structDefinition[key];

//     // Recursively check nested objects
//     if (typeof dataValue === 'object' && typeof definitionValue === 'object') {
//       compareKeys(dataValue as StructData, definitionValue as RecursiveStructDefinition);
//     }
//   }
// }

export function verifyKeysEquality(
  structData: StructData,
  structDefinition: RecursiveStructDefinition
) {
  debug('verify equal', structData, structDefinition);
  const structDataKeys = Object.keys(structData);
  debug('structDefinition', structDefinition);
  const structDefinitionKeys = Object.entries(structDefinition)
    .filter(([key, value]) => {
      return value instanceof DataType;
    })
    .map(([key, value]) => {
      return key;
    });

  debug('structDefinitionKeys', structDefinitionKeys);

  if (structDataKeys.length !== structDefinitionKeys.length) {
    debug('structDataKeys', structDataKeys);
    debug('structDefinitionKeys', structDefinitionKeys);
    throw new Error('StructData and StructDefinition have different amount of keys');
  }

  for (const key of structDefinitionKeys) {
    if (!structDataKeys.includes(key)) {
      debug('structDefinitionKeys', structDefinitionKeys, key);
      throw new Error(`StructDefinition has key that is missing in StructData: ${key}`);
    }

    const value1 = structData[key];
    const value2 = structDefinition[key];

    if (typeof value1 === 'object' && typeof value2 === 'object') {
      // const isNestedEqual =
      verifyKeysEquality(value1 as StructData, value2 as RecursiveStructDefinition);
      // if (!isNestedEqual) {
      //   return false;
      // }
    }
  }

  // return true;
}
function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null;
}

/**
 * Function that returns the class StructClass.
 *
 * @param {string} name Name of struct
 * @param {RecursiveStructDefinition} structDefinition Definition of struct, an object with
 *   DataTypes.
 */
export function Struct<T extends RecursiveStructDefinition>(name: string, structDefinition: T) {
  // Determine size of struct (and if size is variable)
  const { size, varsize } = getStructSize(structDefinition);

  // Seal the definition
  // Object.seal(structDefinition); // TODO: uncomment

  // Create type for static fromBuffer
  type StructDataDefaultTypes = StructDataTypesFromDefinition<T>;

  // Infer from the struct definition the struct type
  // For example: { propOne: DataType.uint8, propTwo: DataType.string }
  // becomes { propOne: number, propTwo: string }.

  return class StructClass {
    // [key: string]: unknown | StructDataTypes | Record<string, unknown | StructDataTypes>;
    // [key: string]: StructDataDefaultTypes
    // [key: string]: StructDataTypes | StructDataItem

    constructor(public structData: StructData) {
      // Validate that given struct data matches the given struct definition
      // verifyKeysEquality(structData, structDefinition); // TODO: fix
      compareKeys(structData, structDefinition);
      // Assign struct data to fields of this class
      // Object.assign(this, { ...structData }); // TODO: is this needed?
    }

    toBuffer(buffer?: Buffer, index: number = 0): Buffer {
      let length = 0;

      if (varsize && !buffer) {
        buffer = Buffer.alloc(size + 255); // TODO: fix my size
      }
      if (!buffer) {
        buffer = Buffer.alloc(size);
      }
      debug('1. toBuffer %o', { buffer, index });

      // TODO: clean this up
      // for (const [key, value] of Object.entries(structDefinition)) {
      //   let _varsize = structDefinition[key].length;
      //   const dataTypeInstance = structDefinition[key];

      //   if (_varsize <= 0) {
      //     const rBuf = dataTypeInstance.toBuffer(buffer, this.structData[key], index + length);
      //     // eslint-disable-next-line no-nested-ternary
      //     _varsize = Number.isFinite(rBuf) ? rBuf : Buffer.isBuffer(rBuf) ? rBuf.length : 0;
      //   } else {
      //     dataTypeInstance.toBuffer(buffer, this.structData[key], index + length);
      //   }
      //   length += _varsize;
      // }

      const structDefinitionToBuffer = (
        structDefinition: RecursiveStructDefinition,
        parentData: StructData | StructDataTypes | StructDataItem = this.structData
      ) => {
        if (buffer == undefined) throw new TypeError('Buffer is undefined');
        debug('2. structDefinitionToBuffer %o', structDefinition);
        for (const [key, parentDataValue] of Object.entries(parentData)) {
          const value = structDefinition[key];
          // debug('toBuffer 2. %o', { key, value });
          // let a = parentData[key];

          // const item = structDefinition[key];

          // type StructDefinition = {
          //   field1: DataType<number>;
          //   field2: DataType<string>;
          //   field3: {
          //     nestedField: DataType<boolean>;
          //     nestedStruct: {
          //       bla: DataType<number>;
          //     };
          //   };
          // };

          if (value instanceof DataType) {
            // DataType.toBuffer
            value;
            let _varsize = value.length;

            if (_varsize <= 0) {
              debug('3A. toBuffer', buffer, parentDataValue, index + length);
              const rBuf = value.toBuffer(buffer, parentDataValue, index + length);
              // eslint-disable-next-line no-nested-ternary
              _varsize = Number.isFinite(rBuf) ? rBuf : Buffer.isBuffer(rBuf) ? rBuf.length : 0;
            } else {
              debug(key);
              debug(parentData);
              debug('3B. toBuffer', buffer, parentDataValue, index + length);
              value.toBuffer(buffer, parentDataValue, index + length);
            }
            length += _varsize;

            debug('4. structDefinitionToBuffer result', { buffer, length });
          } else {
            // let parentData = this.structData[key];
            structDefinitionToBuffer(value, parentDataValue);
            // let a = Object.entries(value);
            // for (const [key, subItem] of Object.entries(value)) {
            //   key;
            //   subItem; //const subItem: RecursiveStructDefinition | DataType<unknown> | Record<string, DataType<unknown>>

            //   // call recursive function again
            //   // structDefinitionToBuffer(subItem);
            // }
          }
        }
      };

      structDefinitionToBuffer(structDefinition);
      // debug('GOT BUFFERS TEST', buffers);

      // TODO: clean this up
      // for (const [key] of Object.entries(structDefinition)) {
      //   const value = structDefinition[key];
      //   const item = structDefinition[key];
      //   debug('toBuffer 2. %o', { key, value });

      //   // const item = structDefinition[key];
      //   let _varsize = structDefinition[key].length;

      //   if (
      //     structDefinition[key] instanceof DataType &&
      //     item instanceof DataType &&
      //     typeof _varsize === 'number' // TODO: handle case were structDefinition[key] is Record with data types
      //   ) {
      //     debug('toBuffer 2. ', 'got instanceof DataType', this.structData);
      //     if (_varsize <= 0) {
      //       const rBuf = item.toBuffer(buffer, this.structData[key], index + length);
      //       // eslint-disable-next-line no-nested-ternary
      //       _varsize = Number.isFinite(rBuf) ? rBuf : Buffer.isBuffer(rBuf) ? rBuf.length : 0;
      //     } else {
      //       item.toBuffer(buffer, this.structData[key], index + length);
      //     }
      //     length += _varsize;
      //   } else if (!(item instanceof DataType)) {
      //     debug('toBuffer 2. ', 'got not instanceof DataType');
      //     // TODO: make this recursive?
      //     for (const [_key, _value] of Object.entries(this.structData[key])) {
      //       // const _value = structDefinition[key][_key];
      //       _varsize = item[_key].length;
      //       debug(
      //         'toBuffer 3. ',
      //         'loop nested DataType',
      //         {
      //           _key
      //           // _value
      //         },
      //         item[_key] instanceof DataType,
      //         typeof _varsize === 'number'
      //       );
      //       if (
      //         item[_key] instanceof DataType &&
      //         typeof _varsize === 'number' // TODO: handle case were structDefinition[key] is Record with data types
      //       ) {
      //         debug('toBuffer 3. ', 'got instanceof DataType');
      //         if (_varsize <= 0) {
      //           debug('toBuffer 4., what is this.structData', this.structData);

      //           const rBuf = item[_key].toBuffer(buffer, _value, index + length);
      //           // eslint-disable-next-line no-nested-ternary
      //           _varsize = Number.isFinite(rBuf) ? rBuf : Buffer.isBuffer(rBuf) ? rBuf.length : 0;
      //         } else {
      //           item[_key].toBuffer(buffer, _value, index + length);
      //         }
      //         length += _varsize;
      //       }
      //     }
      //   }
      // }

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
      debug('fromBuffer', { buffer, index, returnLength });
      // Length cursor used for reading multiple DataTypes from the buffer
      let length = 0;

      // Result object will be the inferred struct type:
      // { booleanProp: DataType<boolean> } -> { booleanProp: boolean }
      const result:
        | StructDataTypesFromDefinition<typeof structDefinition>
        | Record<string, unknown> = {};

      // TODO: recursive

      // Loop the struct definition ({ booleanProp: DataType<boolean> })
      for (const [key, dataTypeInstance] of Object.entries(structDefinition)) {
        debug('fromBuffer 1.', { key, dataTypeInstance });

        // If DataType has positive length call fromBuffer and add the length of
        // the DataType to the length cursor.
        // structDefinition[key] instanceof DataType &&
        // dataTypeInstance instanceof DataType &&
        // typeof _varsize === 'number' // TODO: handle case were structDefinition[key] is Record with data types

        if (dataTypeInstance instanceof DataType && dataTypeInstance.length > 0) {
          result[key] = dataTypeInstance.fromBuffer(buffer, index + length);
          length += dataTypeInstance.length;
        } else if (!(dataTypeInstance instanceof DataType)) {
          for (const [_key, _dataTypeInstance] of Object.entries(dataTypeInstance)) {
            debug('fromBuffer 2.', { _key, _dataTypeInstance });

            result[key] = result[key] || {};

            // TODO: can this be fixed?
            // @ts-expect-error ???
            result[key][_key] = _dataTypeInstance.fromBuffer(buffer, index + length);
            // @ts-expect-error fix recursive
            length += _dataTypeInstance.length;
          }
        } else {
          if (dataTypeInstance instanceof DataType) {
            // TODO: handle case where dataTypeInstance is record of DataTypes
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

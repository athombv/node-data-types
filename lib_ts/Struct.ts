import { strict as assert } from 'assert';

import { DataType } from './DataType';
import { TypesMap, DataTypes } from './DataTypes';

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

// type UnpromiseObj<T> = {
//   [K in keyof T]: T[K] extends Promise<infer U>
//     ? U
//     : T[K] extends (...args: infer A) => Promise<infer R>
//     ? (...args: A) => R
//     : T[K];
// };

// type UnpromiseObj<T> = {
//   [K in keyof T]: T[K] extends DataType<infer U>
//     ? U
//     : T[K] extends (...args: infer A) => Promise<infer R>
//     ? (...args: A) => R
//     : T[K];
// };

// type x = typeof DataTypes.uint16;
// type y = UnpromiseObj<typeof struct;

type InferDataTypeGenericType<T> = {
  [K in keyof T]: T[K] extends DataType<infer U> ? U : never;
};

// type x = typeof DataTypes.uint16;
// type y = InferDataTypeGenericType<typeof structDefinitionOne>;
// type z = InferDataTypeGenericType<typeof structDefinitionTwo>;

type StructDefWrap<T extends { [key: string]: { defaultValue: any } }> = {
  [Key in keyof T]: T[Key]['defaultValue'] extends infer DefaultType
    ? DefaultType extends string
      ? string
      : DefaultType extends boolean
      ? boolean
      : DefaultType extends number
      ? number
      : never
    : never;
};

type InferStructTypesFromDefinition<T extends StructDefinition> = {
  [K in keyof T]: T[K] extends DataType<infer U> ? U : never;
};

// const structDef = {
//   prop: DataTypes.uint16
// }

// type x = InferStructTypesFromDefinition<typeof structDef>;

type H = Record<keyof TypesMap, { defaultValue: any }>;
// type StructDefinition = Record<keyof TypesMap, DataType<TypesMap[keyof TypesMap]>>;
// TODO: this class implementation can be removed when Struct() is fully working
export class StructClass<T extends { [key: string]: { defaultValue: any } }> {
  constructor(private structDefinition: { [key: string]: DataType<unknown> }) {
    // Seal the definition
    Object.seal(this.structDefinition);
  }
  index: number = 0;
  toBuffer(
    buffer: Buffer,
    structImplementation: Record<string, number | boolean | string>,
    index: number = 0
  ): Buffer {
    for (const [key, value] of Object.entries(this.structDefinition)) {
      const dataTypeInstance = this.structDefinition[key];
      dataTypeInstance.toBuffer(buffer, structImplementation[key], index);
      index += dataTypeInstance.length;
    }
    return buffer;
  }

  fromBuffer(buffer: Buffer) {
    let index = 0;
    const result: Partial<StructDefWrap<T>> = {};
    for (const [key, dataTypeInstance] of Object.entries(this.structDefinition)) {
      // @ts-expect-error not sure why?
      result[key] = dataTypeInstance.fromBuffer(buffer, index);
      index += dataTypeInstance.length;
    }

    // Make sure result keys are as defined in struct
    const resultKeys = Object.keys(result);
    const structDefinitionKeys = Object.keys(this.structDefinition);
    try {
      assert.deepStrictEqual(resultKeys, structDefinitionKeys);
    } catch {
      // Throw informative error about missing keys
      throw new Error(
        `Result parsed from buffer is missing keys from struct definition. Expected: ${structDefinitionKeys}, got: ${resultKeys}.`
      );
    }

    // Make sure result types are as defined in struct
    const resultTypes = Object.values(result).map((x) => typeof x);
    const structDefinitionTypes = Object.values(this.structDefinition).map(
      (x) => typeof x.defaultValue
    );
    try {
      assert.deepStrictEqual(resultTypes, structDefinitionTypes);
    } catch {
      // Throw informative error about invalid value types
      throw new Error(
        `Result parsed from buffer has different value types then struct definition. Expected: ${structDefinitionTypes}, got: ${resultTypes}.`
      );
    }

    // Now we can safely assume result is of type derived from struct definition
    return result as StructDefWrap<T>;
  }
}

const structDefinitionOne = {
  booleanProp: DataTypes.bool,
  uint8Prop: DataTypes.uint8,
  uint16Prop: DataTypes.uint16,
  data8Prop: DataTypes.data8
};
type StructType = InferDataTypeGenericType<typeof structDefinitionOne>;

// function bla(_structDefinition: { [key: string]: DataType<unknown> }) {
//   type StructTypeX = InferDataTypeGenericType<typeof structDefinitionOne>;
//   const test: StructTypeX = {};
//   return test;
// }

// const testy = bla(structDefinitionOne);
// testy.fsad;
// type H = Record<keyof TypesMap, { defaultValue: any }>;
// type StructDefinition = Record<keyof TypesMap, DataType<unknown>>;
// const x: StructDefinition = {NoData: new}

export function TestStructType(
  name: string,
  _structDefinition: { [key: string]: DataType<unknown> }
) {
  // Seal the definition
  Object.seal(_structDefinition);

  // Infer from the struct definition the struct type
  // For example: {propOne: DataType.uint8, propTwo: DataType.string }
  // becomes {propOne: number, propTwo: string}.
  type StructType = InferDataTypeGenericType<typeof _structDefinition>;
  const result: StructType = {
    myProp: true
  };

  const fn = () => {
    return result as StructType;
  };
  return fn;
}

// const structDef = { myProp: DataTypes.bool }
// type ja = InferStructDef<typeof structDef>

const bla = TestStructType('test', { myProp: DataTypes.bool });
const kfd = bla();
// kfd.myProp.trim();

type StructDefinition = { [key: string]: DataType<unknown> };
export function Struct(
  name: string,
  _structDefinition: StructDefinition
) {
  // Determine size of struct (and if size is variable)
  const { size, varsize } = getStructSize(_structDefinition);

  // Seal the definition
  Object.seal(_structDefinition);

  // Infer from the struct definition the struct type
  // For example: {propOne: DataType.uint8, propTwo: DataType.string }
  // becomes {propOne: number, propTwo: string}.
  // type StructType = InferDataTypeGenericType<typeof _structDefinition>;
  // console.log(typeof StructType);
  // TODO: clean this up
  const r = {
    [name]: class StructClass {
      constructor(
        public structImplementation: Record<
          string,
          number | boolean | string | string[] | number[] | Buffer
        >
      ) {
        for (const key in structImplementation) {
          if (!_structDefinition[key]) {
            throw new TypeError(`${this.constructor.name}: ${key} is an unexpected property`);
          }
          // TODO: clean this up
          // @ts-expect-error
          this[key] = structImplementation[key];
        }
        // eslint-disable-next-line no-restricted-syntax
        for (const key in _structDefinition) {
          if (typeof structImplementation[key] === 'undefined') {
            // TODO: clean this up
            // @ts-expect-error
            this[key] = _structDefinition[key].defaultValue;
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

        // TODO: update implementation based on Struct.js?
        // TODO: clean this up
        for (const [key, value] of Object.entries(_structDefinition)) {
          let _varsize = _structDefinition[key].length;
          const dataTypeInstance = _structDefinition[key];

          if (_varsize <= 0) {
            const rBuf = dataTypeInstance.toBuffer(
              buffer,
              this.structImplementation[key],
              index + length
            );
            // eslint-disable-next-line no-nested-ternary
            _varsize = Number.isFinite(rBuf) ? rBuf : Buffer.isBuffer(rBuf) ? rBuf.length : 0;
          } else {
            dataTypeInstance.toBuffer(buffer, this.structImplementation[key], index + length);
          }
          length += _varsize;
        }

        return buffer.subarray(index, index + length);
      }

      // TODO:
      // static get length() {
      //   return varsize ? -size : size;
      // }

      // TODO:
      // static get name() {
      //   return name;
      // }

      // TODO:
      // static fromJSON(props) {
      //   return new this(props);
      // }

      // TODO:
      // toJSON() {
      //   const result = {};

      //   // eslint-disable-next-line guard-for-in,no-restricted-syntax
      //   for (const key in defs) {
      //     result[key] = this[key];
      //   }

      //   return result;
      // }

      // TODO:
      // static fromArgs(...args) {
      //   return new this(Object.keys(defs).reduce((res, key, i) => {
      //     res[key] = args[i];
      //     return res;
      //   }, {}));
      // }

      static get fields() {
        return _structDefinition;
      }

      static toBuffer(buffer: Buffer, value: unknown, index: number) {
        //TODO: clean this up
        // @ts-expect-error
        if (!(value instanceof this.constructor)) value = new this(value);
        if (!(value instanceof StructClass)) throw new TypeError('Expected Struct instance');
        return value.toBuffer(buffer, index);
      }

      // Overloading here is necessary due to return type that depends on
      // returnLength being true or not.
      static fromBuffer<T extends StructDefinition>(
        buffer: Buffer,
        index?: number
      ): InferStructTypesFromDefinition<T>;
      static fromBuffer<T extends StructDefinition>(
        buffer: Buffer,
        index?: number,
        returnLength?: false
      ): InferStructTypesFromDefinition<T>;
      static fromBuffer<T extends StructDefinition>(
        buffer: Buffer,
        index?: number,
        returnLength?: true
      ): { result: InferStructTypesFromDefinition<T>; length: number };
      static fromBuffer<T extends StructDefinition>(
        buffer: Buffer,
        index: number = 0,
        returnLength: boolean = false
      ):
        | InferStructTypesFromDefinition<T>
        | { result: InferStructTypesFromDefinition<T>; length: number } {
        let length = 0;

        // TODO: clean this up
        const result: Partial<InferStructTypesFromDefinition<T>> = {};

        for (const [key, dataTypeInstance] of Object.entries(_structDefinition)) {
          if (dataTypeInstance.length > 0) {
            // @ts-expect-error not sure why?
            result[key] = dataTypeInstance.fromBuffer(buffer, index + length);
            length += dataTypeInstance.length;
          } else {
            const entry = dataTypeInstance.fromBuffer(
              buffer.subarray(index, index + buffer.length - (size - length)),
              length,
              true
            );
            // @ts-expect-error not sure why?
            result[key] = entry.result;
            length += entry.length;
          }
        }

        // Make sure result keys are as defined in struct
        const resultKeys = Object.keys(result);
        const structDefinitionKeys = Object.keys(_structDefinition);
        try {
          assert.deepStrictEqual(resultKeys, structDefinitionKeys);
        } catch {
          // Throw informative error about missing keys
          throw new Error(
            `Result parsed from buffer is missing keys from struct definition. Expected: ${structDefinitionKeys}, got: ${resultKeys}.`
          );
        }

        // Make sure result types are as defined in struct
        // TODO: this doesn't work for map/enum with Bitmap and other types, maybe fix using type map in DataTypes.ts?
        // const resultTypes = Object.values(result).map((x) => typeof x);
        // const structDefinitionTypes = Object.values(_structDefinition).map(
        //   (x) => typeof x.defaultValue
        // );
        // try {
        //   console.log('Result types', resultTypes);
        //   console.log('Result keys', resultKeys);
        //   console.log('Definition types', structDefinitionTypes);
        //   console.log('Definition keys', structDefinitionKeys);
        //   assert.deepStrictEqual(resultTypes, structDefinitionTypes);
        // } catch {
        //   // Throw informative error about invalid value types
        //   throw new Error(
        //     `Result parsed from buffer has different value types then struct definition. Expected: ${structDefinitionTypes}, got: ${resultTypes}.`
        //   );
        // }

        // Now we can safely assume result is of type derived from struct definition
        // assert.deepEqual(result, this.structImplementation);
        // TODO:
        if (returnLength && varsize) {
          return {
            length: index,
            result: result as InferStructTypesFromDefinition<T>
          };
        }
        return result as InferStructTypesFromDefinition<T>;
      }
    }
  };
  return r[name];
}

// export function Struct<T extends { [key: string]: { defaultValue: any } }>(
//   name: string,
//   _structDefinition: { [key: string]: DataType<unknown> }
// ) {
//   return new StructClass<T>(_structDefinition);
// }

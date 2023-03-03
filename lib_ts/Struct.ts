import { DataType } from './DataType';

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

type InferDataTypeGenericType<T> = {
  [K in keyof T]: T[K] extends DataType<infer U> ? U : never;
};

type InferStructTypesFromDefinition<T extends StructDefinition> = {
  [K in keyof T]: T[K] extends DataType<infer U> ? U : never;
};

type StructDefinition = { [key: string]: DataType<unknown> };

export function Struct<T extends StructDefinition>(
  name: string,
  _structDefinition: StructDefinition
) {
  // Determine size of struct (and if size is variable)
  const { size, varsize } = getStructSize(_structDefinition);

  // Seal the definition
  Object.seal(_structDefinition);

  // Create type for static fromBuffer
  type StructData = InferStructTypesFromDefinition<T>;

  // Infer from the struct definition the struct type
  // For example: { propOne: DataType.uint8, propTwo: DataType.string }
  // becomes { propOne: number, propTwo: string }.
  // TODO: clean this up
  return class StructClass {
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

    // TODO: illegal to use static name/length on a class in TS
    // static get length() {
    //   return varsize ? -size : size;
    // }

    // TODO: illegal to use static name/length on a class in TS
    // static get name() {
    //   return name;
    // }

    // TODO: does not seem to be used anywhere
    // static fromJSON(props) {
    //   return new this(props);
    // }

    // TODO: does not seem to be used anywhere
    // toJSON() {
    //   const result = {};

    //   // eslint-disable-next-line guard-for-in,no-restricted-syntax
    //   for (const key in defs) {
    //     result[key] = this[key];
    //   }

    //   return result;
    // }

    // TODO: does not seem to be used anywhere
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
    static fromBuffer(buffer: Buffer, index?: number): StructData;
    static fromBuffer(buffer: Buffer, index?: number, returnLength?: false): StructData;
    static fromBuffer(
      buffer: Buffer,
      index?: number,
      returnLength?: true
    ): { result: StructData; length: number };
    static fromBuffer(
      buffer: Buffer,
      index: number = 0,
      returnLength: boolean = false
    ): StructData | { result: StructData; length: number } {
      // Length cursor used for reading multiple DataTypes from the buffer
      let length = 0;

      // Result object will be the inferred struct type:
      // { booleanProp: DataType<boolean> } -> { booleanProp: boolean }
      const result: InferStructTypesFromDefinition<typeof _structDefinition> = {};

      // Loop the struct definition ({ booleanProp: DataType<boolean> })
      for (const [key, dataTypeInstance] of Object.entries(_structDefinition)) {
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
          result: result as StructData
        };
      }
      return result as StructData;
    }
  };
}

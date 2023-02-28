import { strict as assert } from 'assert';

import { DataType } from './DataType';

export type StructDefWrap<T extends { [key: string]: { defaultValue: any } }> = {
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

export class StructClass<T extends { [key: string]: { defaultValue: any } }> {
  constructor(private structDefinition: { [key: string]: DataType<unknown> }) {}
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

export function Struct<T extends { [key: string]: { defaultValue: any } }>(
  name: string,
  _structDefinition: { [key: string]: DataType<unknown> }
) {
  // let size = 0;
  // let varsize = false;
  // for (const dt of Object.values(_structDefinition)) {
  //   if (typeof dt.length === 'number' && dt.length > 0) {
  //     size += dt.length;
  //   } else varsize = true;
  // }
  // const r = {
  //   [name]: class StructClass<T extends { [key: string]: { defaultValue: any } }> {
  //     structDefinition = _structDefinition;
  //     // TODO should structDefinition be private?
  //     constructor(public structImplementation: { [key: string]: DataType<unknown> }) {}
  //     index: number = 0;
  //     toBuffer(
  //       buffer?: Buffer,
  //       // structImplementation: Record<string, number | boolean | string>,
  //       index: number = 0
  //     ): Buffer {
  //       // if (!buffer) {
  //       //   buffer = Buffer.alloc(size); // TODO: which size? // TODO: variable size?
  //       // }
  //       // for (const [key, value] of Object.entries(this.structDefinition)) {
  //       //   const dataTypeInstance = this.structDefinition[key];
  //       //   console.log('dataTypeInstance.toBuffer', buffer, key, index, this.structImplementation[key])
  //       //   dataTypeInstance.toBuffer(buffer, this.structImplementation[key], index);
  //       //   index += dataTypeInstance.length;
  //       // }
  //       // return buffer;

  //       let length = 0;
  //       index = index || 0;

  //       if (varsize && !buffer) {
  //         buffer = Buffer.alloc(size + 255); // TODO:fix my size
  //       } else if (!buffer) {
  //         buffer = Buffer.alloc(size);
  //       }

  //       // eslint-disable-next-line guard-for-in,no-restricted-syntax
  //       for (const p in _structDefinition) {
  //         // eslint-disable-next-line no-shadow
  //         let varsize = _structDefinition[p].length;
  //         if (_structDefinition[p].length <= 0) {
  //           const rBuf = _structDefinition[p].toBuffer(
  //             buffer,
  //             this.structImplementation[p],
  //             index + length
  //           );
  //           // eslint-disable-next-line no-nested-ternary
  //           varsize = Number.isFinite(rBuf) ? rBuf : Buffer.isBuffer(rBuf) ? rBuf.length : 0;
  //         } else
  //           _structDefinition[p].toBuffer(buffer, this.structImplementation[p], index + length);

  //         length += varsize;
  //       }

  //       return buffer.subarray(index, index + length);
  //     }
  //     static fromBuffer(buffer: Buffer, index: number, returnLength?: boolean) {
  //       index = index || 0;
  //       let length = 0;
  //       // @ts-expect-error whut?
  //       const result = new this(); // TODO:?
  //       // eslint-disable-next-line no-restricted-syntax
  //       for (const p in _structDefinition) {
  //         if (_structDefinition[p].length > 0) {
  //           // @ts-expect-error whut?
  //           result[p] = _structDefinition[p].fromBuffer(buffer, index + length, false);
  //           length += _structDefinition[p].length;
  //         } else {
  //           const entry = _structDefinition[p].fromBuffer(
  //             buffer.slice(index, index + buffer.length - (size - length)),
  //             length,
  //             true
  //           );
  //           // @ts-expect-error whut?
  //           result[p] = entry.result;
  //           length += entry.length;
  //         }
  //       }
  //       if (returnLength && varsize) {
  //         return {
  //           result,
  //           length
  //         };
  //       }
  //       return result;
  //     }

  //     fromBuffer(buffer: Buffer) {
  //       let index = 0;
  //       const result: Partial<StructDefWrap<T>> = {};
  //       for (const [key, dataTypeInstance] of Object.entries(this.structDefinition)) {
  //         // @ts-expect-error not sure why?
  //         result[key] = dataTypeInstance.fromBuffer(buffer, index);
  //         index += dataTypeInstance.length;
  //       }

  //       // Make sure result keys are as defined in struct
  //       const resultKeys = Object.keys(result);
  //       const structDefinitionKeys = Object.keys(this.structDefinition);
  //       try {
  //         assert.deepStrictEqual(resultKeys, structDefinitionKeys);
  //       } catch {
  //         // Throw informative error about missing keys
  //         throw new Error(
  //           `Result parsed from buffer is missing keys from struct definition. Expected: ${structDefinitionKeys}, got: ${resultKeys}.`
  //         );
  //       }

  //       // Make sure result types are as defined in struct
  //       const resultTypes = Object.values(result).map((x) => typeof x);
  //       const structDefinitionTypes = Object.values(this.structDefinition).map(
  //         (x) => typeof x.defaultValue
  //       );
  //       try {
  //         assert.deepStrictEqual(resultTypes, structDefinitionTypes);
  //       } catch {
  //         // Throw informative error about invalid value types
  //         throw new Error(
  //           `Result parsed from buffer has different value types then struct definition. Expected: ${structDefinitionTypes}, got: ${resultTypes}.`
  //         );
  //       }

  //       // Now we can safely assume result is of type derived from struct definition
  //       return result as StructDefWrap<T>;
  //     }
  //   }
  // };
  // return r[name];

  return new StructClass<T>(_structDefinition);
}

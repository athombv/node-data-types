import { strict as assert } from "assert";

import { DataType } from "./DataType";

export type StructDefWrap<T extends { [key: string]: { defaultValue: any } }> = {
  [Key in keyof T]: T[Key]["defaultValue"] extends infer DefaultType
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
  defs: { [key: string]: DataType<unknown> }
) {
  return new StructClass<T>(defs);
}

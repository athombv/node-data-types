/**
 * Type guard for array of strings.
 */
export function isStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false;
  if (value.some((i) => typeof i !== 'string')) return false;
  return true;
}

/**
 * Type guard for array of numbers.
 */
export function isNumberArray(value: unknown): value is number[] {
  if (!Array.isArray(value)) return false;
  if (value.some((i) => typeof i !== 'number')) return false;
  return true;
}

/**
 * Type guard for object with only number values.
 */
export function isObjectWithNumberValues(input: unknown): input is Record<string, number> {
  return (
    typeof input === 'object' &&
    input !== null &&
    !Array.isArray(input) &&
    Object.values(input).every((i) => typeof i === 'number')
  );
}

/**
 * Deep merge utility for config objects.
 *
 * Recursively merges overrides into defaults:
 * - Objects: recursively merge nested properties
 * - Arrays: replace entirely (don't concat)
 * - Primitives/null/undefined: use override value when defined
 */

/**
 * Check if a value is a plain object (not null, array, Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
  );
}

/**
 * Deep merge two objects, with overrides taking precedence.
 *
 * Accepts `unknown` as the second parameter to work with JSON.parse() output
 * without requiring type assertions at the call site.
 *
 * @param defaults - The base object with default values (typed)
 * @param overrides - Object with values to override (can be unknown from JSON.parse)
 * @returns A new object with merged values, typed as the defaults type
 *
 * @example
 * ```typescript
 * const defaults = {
 *   search: { mode: 'hybrid', limit: 10, rrf: { k: 40 } }
 * };
 * const overrides = JSON.parse('{"search": {"mode": "vector"}}');
 * const result = deepMerge(defaults, overrides);
 * // { search: { mode: 'vector', limit: 10, rrf: { k: 40 } } }
 * ```
 */
export function deepMerge<T extends object>(defaults: T, overrides: unknown): T {
  // If overrides is not a plain object, return defaults unchanged
  if (!isPlainObject(overrides)) {
    return { ...defaults };
  }

  // Use internal helper that works with Record types
  // Type assertions unavoidable here: we need to bridge generic T to Record<string, unknown>
  // for iteration while preserving the return type. This is safe because we spread defaults
  // and only add/replace properties that exist in overrides.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const defaultsRecord = defaults as T & Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return deepMergeRecords(defaultsRecord, overrides) as T;
}

/**
 * Internal implementation that works with Record types.
 * Separated to satisfy TypeScript's type system without assertions.
 */
function deepMergeRecords(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...defaults };

  for (const key of Object.keys(overrides)) {
    const defaultValue = defaults[key];
    const overrideValue = overrides[key];

    // Skip undefined overrides (treat as "not specified")
    if (overrideValue === undefined) {
      continue;
    }

    // If both values are plain objects, recursively merge
    if (isPlainObject(defaultValue) && isPlainObject(overrideValue)) {
      result[key] = deepMergeRecords(defaultValue, overrideValue);
    } else {
      // Arrays, primitives, null, Date, etc. - use override directly
      result[key] = overrideValue;
    }
  }

  return result;
}

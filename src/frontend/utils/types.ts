export type Maybe<T> = T | undefined;

export type Nullable<T> = T | null;

/**
 * Compare 2 types and get all the values that are in type `T` and not in type `U`.
 * For instance:
 *   `Diff<'a' | 'b' | 'c', 'b' | 'c'>` is `'a'`
 */
type Diff<
  T extends string | number | symbol,
  U extends string | number | symbol
> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];

/**
 * Omit all keys from type T that are in K.
 * `Omit<{ a: null, b: null, c: null }, 'a' | 'c'>` is `{ b: null }`
 */
export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

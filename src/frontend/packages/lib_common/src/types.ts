export type Maybe<T> = T | undefined;

export type Nullable<T> = T | null;

/**
 * Omit all keys from type T that are in K.
 * `Omit<{ a: null, b: null, c: null }, 'a' | 'c'>` is `{ b: null }`
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

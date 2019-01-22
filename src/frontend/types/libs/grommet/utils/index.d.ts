declare module 'grommet/utils' {
  // colors.js
  const normalizeColor: (
    color: string,
    theme: object,
    required?: boolean,
  ) => string;

  export { normalizeColor };
  // object.js
  export type DeepReadonly<T extends object> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]
  };
  export type NonUndefined<T> = T extends undefined ? never : T;
  export type NonUndefinedProps<T extends object> = {
    [K in keyof T]?: NonUndefined<T[K]>
  };

  export type DeepFreeze = <T extends object>(obj: T) => DeepReadonly<T>;

  // overload because generic variadic solution has messy result and all/most mergings are binary
  export interface DeepMerge {
    <T extends object, S extends object>(target: T, source: S): T & S;
    <T extends object, S extends object[]>(target: T, ...sources: S): T &
      S[number];
  }

  const isObject: (item: any) => boolean;
  const deepFreeze: DeepFreeze;
  const deepMerge: DeepMerge;
  const removeUndefined: <T extends object>(obj: T) => NonUndefinedProps<T>;

  export { isObject, deepFreeze, deepMerge, removeUndefined };
}

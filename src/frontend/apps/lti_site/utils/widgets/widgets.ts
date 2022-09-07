import { Maybe } from 'utils/types';

let timeoutId: Maybe<number>;

export const debounce = <T>(
  fn: (updatedVideoProperty: Partial<T>) => void,
  ms = 500,
) => {
  return (updatedVideoProperty: Partial<T>) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(updatedVideoProperty), ms);
  };
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/**
 * Wrapper to be able to lazy import a module not default exported
 * https://github.com/facebook/react/issues/14603#issuecomment-726551598
 */
import { lazy } from 'react';

export const lazyImport = <T extends {}, U extends keyof T>(
  loader: (x?: string) => Promise<T>,
) =>
  new Proxy({} as unknown as T, {
    get: (_target, componentName: string | symbol) => {
      if (typeof componentName === 'string') {
        return lazy(() =>
          loader(componentName).then((x) => ({
            default: x[componentName as U] as any as React.ComponentType<any>,
          })),
        );
      }

      return;
    },
  });

import { ErrorComponents } from '.';

/**
 * Route for the `<FullScreenError />` component.
 * @param code One of the error codes (strings) supported by `<FullScreenError />`
 */

export const FULL_SCREEN_ERROR_ROUTE = {
  base: 'errors',
  all: `errors/*`,
  default: '/errors/:code',
  codes: ErrorComponents,
  code: ':code',
};

export const builderFullScreenErrorRoute = (code?: ErrorComponents) => {
  return `/${FULL_SCREEN_ERROR_ROUTE.base}/${code || ''}`;
};

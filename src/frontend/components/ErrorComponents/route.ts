import { ErrorComponentsProps } from '.';

/**
 * Route for the `<FullScreenError />` component.
 * @param code One of the error codes (strings) supported by `<FullScreenError />`
 */
export const FULL_SCREEN_ERROR_ROUTE = (code?: ErrorComponentsProps['code']) =>
  code ? `/errors/${code}` : '/errors/:code';

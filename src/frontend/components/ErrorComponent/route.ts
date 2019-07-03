import { ErrorComponentProps } from '.';

/**
 * Route for the `<ErrorComponent />` component.
 * @param code One of the error codes (strings) supported by `<ErrorComponent />`
 */
export const ERROR_COMPONENT_ROUTE = (code?: ErrorComponentProps['code']) =>
  code ? `/errors/${code}` : '/errors/:code';

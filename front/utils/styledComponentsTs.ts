import * as React from 'react';
import { ThemedStyledFunction } from 'styled-components';

export const styledComponentWithProps = <
  SProps,
  TProps extends object = {},
  U extends HTMLElement = HTMLElement
>(
  styledFunction: ThemedStyledFunction<any, any>, // tslint:disable-line no-any
): ThemedStyledFunction<SProps & React.HTMLProps<U>, TProps> => {
  return styledFunction;
};

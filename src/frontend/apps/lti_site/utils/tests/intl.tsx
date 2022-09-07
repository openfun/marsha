import React from 'react';
import { IntlProvider } from 'react-intl';

export const wrapInIntlProvider = (
  Component: JSX.Element,
  locale: string = 'en',
) => <IntlProvider locale={locale}>{Component}</IntlProvider>;

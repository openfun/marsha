import React from 'react';
import { IntlProvider } from 'react-intl';

export const wrapInIntlProvider = (Component: JSX.Element, locale = 'en') => (
  <IntlProvider locale={locale}>{Component}</IntlProvider>
);

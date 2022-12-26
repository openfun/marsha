import React from 'react';
import { IntlProvider } from 'react-intl';

export const wrapInIntlProvider = (
  Component: JSX.Element,
  locale: string = 'en',
) => (
  <IntlProvider
    locale={locale}
    onError={(err) => {
      // https://github.com/formatjs/formatjs/issues/465
      if (err.code === 'MISSING_TRANSLATION') {
        return;
      }
      throw err;
    }}
  >
    {Component}
  </IntlProvider>
);

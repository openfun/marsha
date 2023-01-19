import React from 'react';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';

export const wrapInIntlProvider = (Component: JSX.Element, locale = 'en') => (
  <IntlProvider
    locale={locale}
    onError={(err) => {
      // https://github.com/formatjs/formatjs/issues/465
      if (
        err.code === ReactIntlErrorCode.MISSING_TRANSLATION ||
        err.code === ReactIntlErrorCode.MISSING_DATA
      ) {
        return;
      }
      throw err;
    }}
  >
    {Component}
  </IntlProvider>
);

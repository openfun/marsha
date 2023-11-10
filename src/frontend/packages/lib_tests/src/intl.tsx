import { ComponentProps } from 'react';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';

type IntlProviderProps = ComponentProps<typeof IntlProvider>;

export const wrapInIntlProvider = (
  Component: JSX.Element,
  option?: IntlProviderProps,
) => (
  <IntlProvider
    locale={option?.locale || 'en'}
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
    {...option}
  >
    {Component}
  </IntlProvider>
);

import { IntlErrorCode } from '@formatjs/intl';
import { IntlConfig, IntlShape, createIntl, createIntlCache } from 'react-intl';

import { Nullable } from './types';

const cache = createIntlCache();
let intlInstance: Nullable<IntlShape> = null;

/**
 * In theory, this default config is not used because each app call this function
 * with their own config when initializing. It is used for testing purposes,
 * as we don't want to give an intl provider to every tests.
 */
let intlConfig: IntlConfig = {
  locale: 'en',
  messages: {},
};
/**
 * Returns the internationalization object. This allows us to format things outside of
 * React lifecycle while reusing the same intl object. The config parameter is optional
 * and will create a new intl instance if a new config is given.
 *
 * @param {IntlConfig} config - Optional configuration for the internationalization object.
 * @return {IntlShape} The internationalization object.
 */
export const getIntl = (config?: IntlConfig): IntlShape => {
  if (!intlInstance || (config && intlConfig !== config)) {
    intlConfig = config || intlConfig;
    intlInstance = createIntl(
      {
        ...intlConfig,
        onError: (err) => {
          // https://github.com/formatjs/formatjs/issues/465
          if (
            err.code === (IntlErrorCode.MISSING_TRANSLATION as IntlErrorCode)
          ) {
            return;
          }
          throw err;
        },
      },
      cache,
    );
  }
  return intlInstance;
};

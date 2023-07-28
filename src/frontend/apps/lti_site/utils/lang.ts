import { shouldPolyfill } from '@formatjs/intl-pluralrules/should-polyfill';
import { getIntl } from 'lib-common';

const getLocales = (baseLocale: string) => {
  let localeCode: string;
  let locale: string;
  try {
    locale = localeCode = baseLocale;
    if (localeCode.match(/^.*_.*$/)) {
      localeCode = localeCode.split('_')[0];
    }
  } catch (e) {
    localeCode = 'en';
    locale = 'en_US';
  }

  return {
    localeCode,
    locale,
  };
};

async function importPolyfill(_locale: string) {
  const unsupportedLocale = shouldPolyfill(_locale);
  // This locale is supported
  if (!unsupportedLocale) {
    return;
  }
  // Load the polyfill 1st BEFORE loading data
  await import('@formatjs/intl-pluralrules/polyfill-force');
  await import(`@formatjs/intl-pluralrules/locale-data/${unsupportedLocale}`);
}

export const createIntl = async (locale: string) => {
  const locales = getLocales(locale);
  importPolyfill(locales.localeCode);

  let translatedMessages: Record<string, string> = {};
  try {
    translatedMessages = (await import(
      `translations/${locales.locale}.json`
    )) as Record<string, string>;
  } catch (e) {}

  return getIntl({ locale: locales.localeCode, messages: translatedMessages });
};

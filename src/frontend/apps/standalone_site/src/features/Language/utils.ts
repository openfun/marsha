import { getTranslations } from 'features/Language/getTranslations';

import { DEFAULT_LOCALE, LANGUAGE_LOCAL_STORAGE, REACT_LOCALES } from './conf';

// Turn a language name (en-us) into a locale name (en_US).
export const toLocale = (language: string) => {
  if (language.match(/^.*-.*$/)) {
    const split_language = language.split('-');
    return `${split_language[0]}_${split_language[1].toUpperCase()}`;
  }

  return language;
};

export const getLanguage = () => {
  const language = localStorage.getItem(LANGUAGE_LOCAL_STORAGE);
  const value_locale = toLocale(
    language || navigator?.language || DEFAULT_LOCALE.locale,
  );

  if (REACT_LOCALES.includes(value_locale)) {
    return value_locale;
  }

  for (const locale of REACT_LOCALES) {
    if (locale.startsWith(value_locale)) {
      return locale;
    }
  }

  return DEFAULT_LOCALE.locale;
};

export const getLocaleCode = (language: string) => {
  if (language.match(/^.*_.*$/)) {
    return language.split('_')[0];
  }

  return language;
};

export const splitLocaleCode = (
  language: string,
): {
  language: string;
  region?: string;
} => {
  const locale = language.split(/[-_]/);
  return {
    language: locale[0],
    region: locale[1],
  };
};

export const getLanguageFromLocale = (locale: string) => {
  const language = new Intl.DisplayNames([locale], {
    type: 'language',
  }).of(splitLocaleCode(locale).language);

  return !language
    ? DEFAULT_LOCALE.language_str
    : language.charAt(0).toUpperCase() + language.slice(1);
};

export const getCurrentTranslation = async (language: string) => {
  const translations = getTranslations();
  let translation: Record<string, string> | undefined;
  const key = `../../translations/${language}.json`;

  if (translations && key in translations) {
    const { default: data } = (await translations[
      `../../translations/${language}.json`
    ]()) as { default: Record<string, string> };

    translation = data;
  } else {
    console.warn(`[intl] No translation found for language ${language}`);
  }

  return translation;
};

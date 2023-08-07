import { DEFAULT_LANGUAGE, REACT_LOCALES } from './conf';

// Turn a language name (en-us) into a locale name (en_US).
export const toLocale = (language: string) => {
  if (language.match(/^.*-.*$/)) {
    const split_language = language.split('-');
    return `${split_language[0]}_${split_language[1].toUpperCase()}`;
  }

  return language;
};

export const getLanguage = () => {
  const value_locale = toLocale(navigator?.language || DEFAULT_LANGUAGE);

  if (REACT_LOCALES.includes(value_locale)) {
    return value_locale;
  }

  for (const locale of REACT_LOCALES) {
    if (locale.startsWith(value_locale)) {
      return locale;
    }
  }

  return DEFAULT_LANGUAGE;
};

export const getLocaleCode = (language: string) => {
  if (language.match(/^.*_.*$/)) {
    return language.split('_')[0];
  }

  return language;
};

export const getCurrentTranslation = async (language: string) => {
  let translation: Record<string, string> | undefined;
  try {
    translation = (await import(
      `translations/${language}.json`
    )) as unknown as Record<string, string>;
  } catch (e) {
    console.warn(`[intl] No translation found for language ${language}`);
  }

  return translation;
};

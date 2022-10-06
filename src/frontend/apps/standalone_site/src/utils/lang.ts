import { DEFAULT_LANGUAGE } from 'conf/global';

export const getLanguage = () =>
  !navigator || !navigator.language ? DEFAULT_LANGUAGE : navigator.language;

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

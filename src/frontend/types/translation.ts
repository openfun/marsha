export type locales = 'en' | 'es' | 'fr';

export enum localesMapping {
  fr = 'fr_FR',
  es = 'es_ES',
  en = 'en_EN',
}

export type TranslatedMessages = {
  [key in localesMapping]?: {
    [id: string]: string;
  }
};

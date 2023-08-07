import { getLanguage, getLocaleCode, toLocale } from './utils';

describe('toLocale', () => {
  it('Turns a language name (en-us) into a locale name (en_US)', () => {
    const language = ['en-us', 'en_US', 'en'];
    const expectation = ['en_US', 'en_US', 'en'];

    language.forEach((lang, index) => {
      expect(toLocale(lang)).toEqual(expectation[index]);
    });
  });
});

describe('getLanguage', () => {
  it('transforms the navigator language (fr) and returns the locale name (fr_FR)', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'fr',
      writable: false,
      configurable: true,
    });

    expect(getLanguage()).toEqual('fr_FR');
  });

  it('fallbacks to default language when navigator.language is undefined', () => {
    Object.defineProperty(navigator, 'language', {
      value: undefined,
      writable: false,
      configurable: true,
    });

    expect(getLanguage()).toEqual('en_US');
  });

  it('fallbacks to default language when navigator.language is defined but unknown', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'it',
      writable: false,
      configurable: true,
    });

    expect(getLanguage()).toEqual('en_US');
  });
});

describe('getLocaleCode', () => {
  it('extracts the locale code from a valid locale name', () => {
    expect(getLocaleCode('fr_FR')).toEqual('fr');
  });

  it('returns the languages passed when it does not match a valid locale name', () => {
    expect(getLocaleCode('fr-FR')).toEqual('fr-FR');
  });
});

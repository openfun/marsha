import { LANGUAGE_LOCAL_STORAGE } from './conf';
import {
  getLanguage,
  getLanguageFromLocale,
  getLocaleCode,
  splitLocaleCode,
  toLocale,
} from './utils';

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
  afterEach(() => {
    localStorage.removeItem(LANGUAGE_LOCAL_STORAGE);
  });

  it('get language from the localStorage in priority', () => {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE, 'fr');

    Object.defineProperty(navigator, 'language', {
      value: 'en',
      writable: false,
      configurable: true,
    });

    expect(getLanguage()).toEqual('fr_FR');
  });

  it('fallbacks to default language when localStorage is defined but unknown', () => {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE, 'it');

    Object.defineProperty(navigator, 'language', {
      value: 'fr',
      writable: false,
      configurable: true,
    });

    expect(getLanguage()).toEqual('en_US');
  });

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

describe('splitLocaleCode', () => {
  it('creates locale object', () => {
    expect(splitLocaleCode('fr_FR')).toEqual({
      language: 'fr',
      region: 'FR',
    });

    expect(splitLocaleCode('fr-FR')).toEqual({
      language: 'fr',
      region: 'FR',
    });

    expect(splitLocaleCode('frFR')).toEqual({
      language: 'frFR',
      region: undefined,
    });

    expect(splitLocaleCode('fr-FR-Test')).toEqual({
      language: 'fr',
      region: 'FR',
    });
  });
});

describe('getLanguageFromLocale', () => {
  it('gets french language from locale fr-CA', () => {
    expect(getLanguageFromLocale('fr-CA')).toEqual('Français');
  });

  it('gets english language from locale en-US', () => {
    expect(getLanguageFromLocale('en-US')).toEqual('English');
  });

  it('gets an error if locale not correct', () => {
    try {
      expect(getLanguageFromLocale('en_US')).toThrowError(
        'RangeError: Incorrect locale information provided',
      );
    } catch (e) {}
  });
});

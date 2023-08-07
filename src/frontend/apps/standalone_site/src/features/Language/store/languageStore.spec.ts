import { useLanguageStore } from './languageStore';

describe('stores/useLanguageStore', () => {
  it('checks the default language', () => {
    expect(useLanguageStore.getState().language).toEqual('en_US');
  });

  it('sets another language', () => {
    useLanguageStore.getState().setLanguage('fr');
    expect(useLanguageStore.getState().language).toEqual('fr_FR');
  });
});

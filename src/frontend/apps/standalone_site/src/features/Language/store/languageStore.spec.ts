import { useLanguageStore } from './languageStore';

jest.mock('../utils', () => {
  return {
    getLanguage: () => 'en_Test',
  };
});

describe('stores/useLanguageStore', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('checks the default language', () => {
    expect(useLanguageStore.getState().language).toEqual('en_Test');
  });
});

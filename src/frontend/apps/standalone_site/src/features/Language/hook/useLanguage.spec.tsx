import { renderHook, waitFor } from '@testing-library/react';

import { getTranslations, useLanguageStore } from '../';

import { useLanguage } from './useLanguage';

jest.mock('features/Language/getTranslations', () => ({
  getTranslations: jest.fn(),
}));
const mockedGetTranslations = getTranslations as jest.MockedFunction<
  typeof getTranslations
>;

const consoleWarn = jest
  .spyOn(console, 'warn')
  .mockImplementation(() => jest.fn());

describe('hook/useLanguage', () => {
  beforeEach(() => {
    mockedGetTranslations.mockReturnValue({
      '../../translations/fr_Test.json': async () =>
        await Promise.resolve({ default: { test: 'Mon test' } }),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    consoleWarn.mockClear();
  });

  it('checks intl is correctly init', async () => {
    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.locale).toEqual('en-US');
    expect(result.current?.defaultLocale).toEqual('en');
    expect(consoleWarn).toHaveBeenCalledWith(
      '[intl] No translation found for language en_US',
    );
  });

  it('checks intl is init with another language', async () => {
    useLanguageStore.setState({
      language: 'fr_Test',
    });

    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.locale).toEqual('fr-Test');
    expect(result.current?.defaultLocale).toEqual('en');
    expect(result.current?.messages).toEqual({ test: 'Mon test' });
  });
});

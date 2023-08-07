import { renderHook, waitFor } from '@testing-library/react';

import { useLanguageStore } from '../store/languageStore';

import { useLanguage } from './useLanguage';

const consoleWarn = jest
  .spyOn(console, 'warn')
  .mockImplementation(() => jest.fn());

describe('hook/useLanguage', () => {
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
      language: 'fr_FR',
    });

    const { result } = renderHook(() => useLanguage());

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.locale).toEqual('fr-FR');
    expect(result.current?.defaultLocale).toEqual('en');
    expect(consoleWarn).toHaveBeenCalledWith(
      '[intl] No translation found for language fr_FR',
    );
  });
});

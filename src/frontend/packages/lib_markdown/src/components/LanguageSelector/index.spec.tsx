import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import React from 'react';

import { LanguageSelector } from './index';

describe('<LanguageSelector />', () => {
  it('displays languages', async () => {
    const onLanguageChange = jest.fn();

    const { rerender } = render(
      <LanguageSelector
        currentLanguage="en"
        onLanguageChange={onLanguageChange}
        disabled={false}
      />,
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: /Select language/i }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: /French/i }),
    );

    expect(onLanguageChange).toHaveBeenCalledTimes(1);
    expect(onLanguageChange).toHaveBeenCalledWith('fr');

    rerender(
      <LanguageSelector
        currentLanguage="fr"
        onLanguageChange={onLanguageChange}
        disabled={false}
      />,
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: /Select language/i }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: /English/i }),
    );

    expect(onLanguageChange).toHaveBeenCalledTimes(2);
    expect(onLanguageChange).toHaveBeenLastCalledWith('en');
  });

  it('displays available languages', async () => {
    const onLanguageChange = jest.fn();

    render(
      <LanguageSelector
        currentLanguage="en"
        onLanguageChange={onLanguageChange}
        disabled={false}
        availableLanguages={['en']}
      />,
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: /Select language/i }),
    );

    expect(screen.queryByText('French')).not.toBeInTheDocument();
  });

  it('displays available languages if current language is not', async () => {
    const onLanguageChange = jest.fn();

    render(
      <LanguageSelector
        currentLanguage="en"
        onLanguageChange={onLanguageChange}
        disabled={false}
        availableLanguages={['fr']}
      />,
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: /Select language/i }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: /French/i }),
    );

    expect(onLanguageChange).toHaveBeenCalledTimes(1);
    expect(onLanguageChange).toHaveBeenCalledWith('fr');
  });
});

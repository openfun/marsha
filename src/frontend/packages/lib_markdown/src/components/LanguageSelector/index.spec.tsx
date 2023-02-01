import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import React from 'react';

import { LanguageSelector } from './index';

describe('<LanguageSelector />', () => {
  it('displays languages', () => {
    const onLanguageChange = jest.fn();

    const { rerender } = render(
      <LanguageSelector
        currentLanguage="en"
        onLanguageChange={onLanguageChange}
        disabled={false}
      />,
    );

    userEvent.click(screen.getByRole('button', { name: 'English' }));
    userEvent.click(screen.getByText('French'));

    // Force dropdown to be hidden again: mandatory for rerender...
    userEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(onLanguageChange).toHaveBeenCalledTimes(1);
    expect(onLanguageChange).toHaveBeenCalledWith('fr');

    rerender(
      <LanguageSelector
        currentLanguage="fr"
        onLanguageChange={onLanguageChange}
        disabled={false}
      />,
    );

    userEvent.click(screen.getByRole('button', { name: 'French' }));
    userEvent.click(screen.getByText('English'));

    expect(onLanguageChange).toHaveBeenCalledTimes(2);
    expect(onLanguageChange).toHaveBeenLastCalledWith('en');
  });

  it('displays available languages', () => {
    const onLanguageChange = jest.fn();

    render(
      <LanguageSelector
        currentLanguage="en"
        onLanguageChange={onLanguageChange}
        disabled={false}
        availableLanguages={['en']}
      />,
    );

    userEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.queryByText('French')).not.toBeInTheDocument();
  });

  it('displays available languages if current language is not', () => {
    const onLanguageChange = jest.fn();

    render(
      <LanguageSelector
        currentLanguage="en"
        onLanguageChange={onLanguageChange}
        disabled={false}
        availableLanguages={['fr']}
      />,
    );

    userEvent.click(screen.getByRole('button', { name: 'English' }));
    userEvent.click(screen.getByText('French'));

    expect(onLanguageChange).toHaveBeenCalledTimes(1);
    expect(onLanguageChange).toHaveBeenCalledWith('fr');
  });
});

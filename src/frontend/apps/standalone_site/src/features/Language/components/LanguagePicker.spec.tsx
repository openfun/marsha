import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { useLanguageStore } from '../store/languageStore';

import LanguagePicker from './LanguagePicker';

describe('<LanguagePicker />', () => {
  beforeEach(() => {});

  it('renders LanguagePicker', async () => {
    render(<LanguagePicker />, {
      intlOptions: { locale: 'en-US' },
    });

    const select = screen.getByRole('combobox');
    expect(select.contains(screen.getByText(/English/i))).toBeTruthy();
    await userEvent.click(select);

    expect(
      screen.getByRole('option', {
        name: /Français/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', {
        name: /English/i,
      }),
    ).toBeInTheDocument();
  });

  it('changes to another language', async () => {
    render(<LanguagePicker />);

    await userEvent.click(screen.getByText(/Language Picker/i));

    await userEvent.click(
      screen.getByRole('option', {
        name: /Français/i,
      }),
    );
    expect(
      screen.getByRole('combobox').contains(screen.getByText(/Français/i)),
    ).toBeTruthy();

    expect(useLanguageStore.getState().language).toEqual('fr_FR');
  });
});

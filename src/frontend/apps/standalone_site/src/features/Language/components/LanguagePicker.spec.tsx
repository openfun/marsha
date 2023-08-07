import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { useLanguageStore } from '../store/languageStore';

import LanguagePicker from './LanguagePicker';

describe('<LanguagePicker />', () => {
  beforeEach(() => {});

  it('renders LanguagePicker', async () => {
    render(<LanguagePicker />);
    expect(screen.getByText(/language/i)).toBeInTheDocument();

    const select = screen.getByLabelText(/Language Picker; Selected: en/i);
    expect(select).toBeInTheDocument();
    await userEvent.click(select);
    expect(screen.getByText(/Français/i)).toBeInTheDocument();
    expect(screen.getByText(/English/i)).toBeInTheDocument();
  });

  it('changes to another language', async () => {
    render(<LanguagePicker />);

    await userEvent.click(
      screen.getByLabelText(/Language Picker; Selected: en/i),
    );

    await userEvent.click(screen.getByText(/Français/i));
    expect(
      screen.getByLabelText(/Language Picker; Selected: fr/i),
    ).toBeInTheDocument();

    expect(useLanguageStore.getState().language).toEqual('fr_FR');
  });
});

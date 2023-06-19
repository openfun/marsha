import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  timedTextMockFactory,
  timedTextMode,
  useTimedTextTrack,
} from 'lib-components';
import { render } from 'lib-tests';

import { LanguageSelect } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const onChangeMock = jest.fn();

const languageChoices = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Swedish', value: 'sv' },
];

describe('<LanguageSelect />', () => {
  //jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the component with instructor local language available', async () => {
    render(
      <LanguageSelect
        onChange={onChangeMock}
        timedTextModeWidget={timedTextMode.SUBTITLE}
        choices={languageChoices}
      />,
      { intlOptions: { locale: 'fr-FR' } },
    );

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenLastCalledWith({
        label: 'French',
        value: 'fr',
      }),
    );

    screen.getByRole('button', {
      name: 'Select the language for which you want to upload a timed text file; Selected: fr',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, fr',
      }),
    ).toHaveValue('French');
  });

  it('renders the component with instructor local language unavailable', async () => {
    render(
      <LanguageSelect
        onChange={onChangeMock}
        timedTextModeWidget={timedTextMode.SUBTITLE}
        choices={languageChoices}
      />,
      { intlOptions: { locale: 'pg-PG' } },
    );

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenLastCalledWith({
        label: 'English',
        value: 'en',
      }),
    );

    screen.getByRole('button', {
      name: 'Select the language for which you want to upload a timed text file; Selected: en',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, en',
      }),
    ).toHaveValue('English');
  });

  it('renders the component with some languages already having some subtitles uploaded', async () => {
    useTimedTextTrack.getState().addMultipleResources([
      timedTextMockFactory({
        language: 'fr',
        mode: timedTextMode.TRANSCRIPT,
      }),
      timedTextMockFactory({
        language: 'sv',
        mode: timedTextMode.SUBTITLE,
      }),
    ]);

    render(
      <LanguageSelect
        onChange={onChangeMock}
        timedTextModeWidget={timedTextMode.SUBTITLE}
        choices={languageChoices}
      />,
      { intlOptions: { locale: 'fr-FR' } },
    );

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenLastCalledWith({
        label: 'French',
        value: 'fr',
      }),
    );

    expect(
      screen.getByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, fr',
      }),
    ).toHaveValue('French');

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Select the language for which you want to upload a timed text file; Selected: fr',
      }),
    );

    screen.getByRole('option', { name: 'English' });
    screen.getByRole('option', { name: 'French' });
    screen.getByRole('option', { name: 'Spanish' });
    screen.getByRole('option', { name: 'Slovenian' });
    expect(
      screen.queryByRole('option', { name: 'Swedish' }),
    ).not.toBeInTheDocument();
  });

  it('renders the component with no languages', async () => {
    render(
      <LanguageSelect
        onChange={onChangeMock}
        timedTextModeWidget={timedTextMode.SUBTITLE}
      />,
      { intlOptions: { locale: 'fr-FR' } },
    );

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenLastCalledWith({
        label: 'No language availables',
        value: 'error',
      }),
    );

    expect(
      screen.queryByRole('button', {
        name: 'Select the language for which you want to upload a timed text file; Selected: fr',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, fr',
      }),
    ).not.toBeInTheDocument();

    screen.getByRole('button', {
      name: 'Select the language for which you want to upload a timed text file; Selected: error',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, error',
      }),
    ).toHaveValue('No language availables');
  });

  it('changes the selected language', async () => {
    render(
      <LanguageSelect
        onChange={onChangeMock}
        timedTextModeWidget={timedTextMode.SUBTITLE}
        choices={languageChoices}
      />,
      { intlOptions: { locale: 'fr-FR' } },
    );

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenLastCalledWith({
        label: 'French',
        value: 'fr',
      }),
    );

    expect(
      await screen.findByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, fr',
      }),
    ).toHaveValue('French');

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Select the language for which you want to upload a timed text file; Selected: fr',
      }),
    );

    const englishButtonOption = screen.getByRole('option', { name: 'English' });

    await userEvent.click(englishButtonOption);

    screen.getByRole('button', {
      name: 'Select the language for which you want to upload a timed text file; Selected: en',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, en',
      }),
    ).toHaveValue('English');
  });
});

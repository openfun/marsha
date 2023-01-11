import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  useTimedTextTrack,
  timedTextMode,
  timedTextMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { LanguageSelect } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const onChangeMock = jest.fn();

const languageChoices = [
  { display_name: 'English', value: 'en' },
  { display_name: 'French', value: 'fr' },
  { display_name: 'Spanish', value: 'es' },
  { display_name: 'Slovenian', value: 'sl' },
  { display_name: 'Swedish', value: 'sv' },
];

describe('<LanguageSelect />', () => {
  jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the component with instructor local language available', async () => {
    fetchMock.mock(
      `/api/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    render(
      <LanguageSelect
        onChange={onChangeMock}
        timedTextModeWidget={timedTextMode.SUBTITLE}
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
    fetchMock.mock(
      `/api/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    render(
      <LanguageSelect
        onChange={onChangeMock}
        timedTextModeWidget={timedTextMode.SUBTITLE}
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
    fetchMock.mock(
      `/api/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

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
      />,
      { intlOptions: { locale: 'fr-FR' } },
    );

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenLastCalledWith({
        label: 'French',
        value: 'fr',
      }),
    );

    const selectButton = screen.getByRole('button', {
      name: 'Select the language for which you want to upload a timed text file; Selected: fr',
    });

    userEvent.click(selectButton);

    screen.getByRole('button', {
      name: 'Select the language for which you want to upload a timed text file; Selected: fr',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, fr',
      }),
    ).toHaveValue('French');
    screen.getByRole('option', { name: 'English' });
    screen.getByRole('option', { name: 'French' });
    screen.getByRole('option', { name: 'Spanish' });
    screen.getByRole('option', { name: 'Slovenian' });
    expect(
      screen.queryByRole('option', { name: 'Swedish' }),
    ).not.toBeInTheDocument();
  });

  it('renders the component with no languages', async () => {
    fetchMock.mock('/api/timedtexttracks/', 500, { method: 'OPTIONS' });

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
    fetchMock.mock(
      `/api/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    render(
      <LanguageSelect
        onChange={onChangeMock}
        timedTextModeWidget={timedTextMode.SUBTITLE}
      />,
      { intlOptions: { locale: 'fr-FR' } },
    );

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenLastCalledWith({
        label: 'French',
        value: 'fr',
      }),
    );

    const selectButton = screen.getByRole('button', {
      name: 'Select the language for which you want to upload a timed text file; Selected: fr',
    });

    userEvent.click(selectButton);

    screen.getByRole('button', {
      name: 'Select the language for which you want to upload a timed text file; Selected: fr',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, fr',
      }),
    ).toHaveValue('French');
    const englishButtonOption = screen.getByRole('option', { name: 'English' });

    userEvent.click(englishButtonOption);

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

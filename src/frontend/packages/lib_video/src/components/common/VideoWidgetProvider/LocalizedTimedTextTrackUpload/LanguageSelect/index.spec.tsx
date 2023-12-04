import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { timedTextMode, useTimedTextTrack } from 'lib-components';
import { timedTextMockFactory } from 'lib-components/tests';
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

    const button = await screen.findByRole('combobox', {
      name: 'Choose the language',
    });
    expect(within(button).getByText('French')).toBeInTheDocument();
  });

  it('propagates correctly undefined when the local language is unavailable', async () => {
    render(
      <LanguageSelect
        onChange={onChangeMock}
        timedTextModeWidget={timedTextMode.SUBTITLE}
        choices={languageChoices}
      />,
      { intlOptions: { locale: 'pg-PG' } },
    );

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenLastCalledWith(undefined),
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Choose the language',
      }),
    ).toBeInTheDocument();
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

    const button = await screen.findByRole('combobox', {
      name: 'Choose the language',
    });
    expect(within(button).getByText('French')).toBeInTheDocument();

    await userEvent.click(button);

    screen.getByRole('option', { name: 'English' });
    screen.getByRole('option', { name: 'French' });
    screen.getByRole('option', { name: 'Spanish' });
    screen.getByRole('option', { name: 'Slovenian' });
    expect(
      screen.queryByRole('option', { name: 'Swedish' }),
    ).not.toBeInTheDocument();
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

    const button = await screen.findByRole('combobox', {
      name: 'Choose the language',
    });
    expect(within(button).getByText('French')).toBeInTheDocument();
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('option', { name: 'English' }));
    expect(within(button).getByText('English')).toBeInTheDocument();
  });
});

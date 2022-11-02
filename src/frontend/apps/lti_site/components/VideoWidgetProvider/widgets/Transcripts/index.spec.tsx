import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';

import { timedTextMode, uploadState } from 'types/tracks';
import { videoMockFactory } from 'lib-components';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { Transcripts } from './index';

const transcriptContent = `
WEBVTT

1
00:00:00.600 --> 00:00:02.240
-Bonjour. Bonjour à tous.

2
00:00:02.560 --> 00:00:05.280
Bienvenue dans ce nouveau MOOC
"Du manager au leader".
`;

const transcripts = [
  {
    active_stamp: 234243242353,
    id: '1',
    is_ready_to_show: true,
    language: 'fr',
    mode: timedTextMode.TRANSCRIPT as timedTextMode.TRANSCRIPT,
    title: 'foo',
    upload_state: uploadState.READY,
    source_url: 'https://example.com/vtt/fr',
    url: 'https://example.com/vtt/fr.vtt',
    video: '42',
  },
  {
    active_stamp: 1243401243953,
    id: '2',
    is_ready_to_show: true,
    language: 'en',
    mode: timedTextMode.TRANSCRIPT as timedTextMode.TRANSCRIPT,
    title: 'foo',
    upload_state: uploadState.READY,
    source_url: 'https://example.com/vtt/en',
    url: 'https://example.com/vtt/en.vtt',
    video: '42',
  },
];

const languagechoices = [
  { value: 'English', label: 'en' },
  { value: 'French', label: 'fr' },
];

describe('<Transcripts />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'foo',
    });

    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        actions: {
          POST: {
            language: {
              choices: [
                { display_name: 'English', value: 'en' },
                { display_name: 'French', value: 'fr' },
              ],
            },
          },
        },
      },
      { method: 'OPTIONS' },
    );

    useTimedTextTrackLanguageChoices.setState({ choices: languagechoices });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('displays a list of available transcripts', () => {
    useTimedTextTrack.getState().addMultipleResources(transcripts);
    const mockedVideo = videoMockFactory({
      id: '42',
      has_transcript: true,
    });
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <Transcripts />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const languageSelect = screen.getByRole('button', {
      name: 'Open Drop; Selected: Choose a language',
    });
    act(() => userEvent.click(languageSelect));

    screen.getByRole('option', {
      name: 'fr',
    });
    screen.getByRole('option', {
      name: 'en',
    });
  });

  it('downloads transcript when the user clicks the download button', () => {
    fetchMock.mock('https://example.com/vtt/fr.vtt', transcriptContent);
    useTimedTextTrack.getState().addMultipleResources(transcripts);
    const mockedVideo = videoMockFactory({
      id: '42',
      has_transcript: true,
    });
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <Transcripts />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const languageSelect = screen.getByRole('button', {
      name: 'Open Drop; Selected: Choose a language',
    });

    act(() => userEvent.click(languageSelect));

    const frenchSelect = screen.getByRole('option', {
      name: 'fr',
    });

    act(() => userEvent.click(frenchSelect));

    const downloadButton = screen.getByText('Download');
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://example.com/vtt/fr',
    );
    fireEvent.click(downloadButton);
  });

  it('shows the transcript when the user selects a language', () => {
    fetchMock.mock('https://example.com/vtt/fr.vtt', transcriptContent);
    useTimedTextTrack.getState().addMultipleResources(transcripts);
    const mockedVideo = videoMockFactory({
      id: '42',
      has_transcript: true,
    });
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <Transcripts />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const languageSelect = screen.getByRole('button', {
      name: 'Open Drop; Selected: Choose a language',
    });

    act(() => userEvent.click(languageSelect));

    const frenchSelect = screen.getByRole('option', {
      name: 'fr',
    });

    act(() => userEvent.click(frenchSelect));

    screen.findByText((content) =>
      content.includes('Bienvenue dans ce nouveau MOOC'),
    );
  });
});

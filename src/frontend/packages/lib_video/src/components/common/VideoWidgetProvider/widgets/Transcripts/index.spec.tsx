import { configure, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useTimedTextTrack,
  useJwt,
  timedTextMode,
  uploadState,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import { VTTCue } from 'vtt.js';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { Transcripts } from './index';

//  force VTTCue intialization in the window
window.VTTCue = window.VTTCue || VTTCue;

const transcriptContent = `WEBVTT

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
  { display_name: 'English', label: 'en' },
  { display_name: 'French', label: 'fr' },
];

const mockedVideo = videoMockFactory({
  id: '42',
  has_transcript: true,
});

describe('<Transcripts />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'foo',
    });

    fetchMock.mock(
      `/api/videos/42/timedtexttracks/`,
      {
        actions: {
          POST: {
            language: {
              choices: [languagechoices],
            },
          },
        },
      },
      { method: 'OPTIONS' },
    );
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('displays a list of available transcripts', async () => {
    useTimedTextTrack.getState().addMultipleResources(transcripts);

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

    userEvent.click(languageSelect);

    expect(
      await screen.findByRole('option', {
        name: 'fr',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', {
        name: 'en',
      }),
    ).toBeInTheDocument();
  });

  it('downloads transcript when the user clicks the download button', async () => {
    fetchMock.mock('https://example.com/vtt/fr.vtt', transcriptContent);
    useTimedTextTrack.getState().addMultipleResources(transcripts);

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

    userEvent.click(languageSelect);

    const frenchSelect = await screen.findByRole('option', {
      name: 'fr',
    });

    userEvent.click(frenchSelect);

    const downloadButton = await screen.findByText('Download');
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://example.com/vtt/fr',
    );
    fireEvent.click(downloadButton);
  });

  it('shows the transcript when the user selects a language', async () => {
    configure({
      getElementError: (message) => {
        const error = new Error(message || '');
        error.name = 'TestingLibraryElementError';
        error.stack = undefined;
        return error;
      },
    });

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

    userEvent.click(languageSelect);

    const frenchSelect = await screen.findByRole('option', {
      name: 'fr',
    });

    userEvent.click(frenchSelect);

    expect(
      await screen.findByText((content) =>
        content.includes('Bienvenue dans ce nouveau MOOC'),
      ),
    ).toBeInTheDocument();
  });
});

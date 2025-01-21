import { act, fireEvent, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  timedTextMode,
  uploadState,
  useJwt,
  useTimedTextTrack,
} from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
// @ts-expect-error: somethings wrong with the vtt.js import
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

const mockedVideo = videoMockFactory({
  id: '42',
  has_transcript: true,
});

describe('<Transcripts />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'foo',
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('downloads transcript when the user clicks the download button', async () => {
    fetchMock.mock('https://example.com/vtt/fr.vtt', transcriptContent);
    useTimedTextTrack.getState().addMultipleResources(transcripts);
    useTimedTextTrack.getState().setSelectedTranscript(transcripts[0]);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <Transcripts />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const downloadButton = await screen.findByText('Download transcript');
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://example.com/vtt/fr',
    );
    fireEvent.click(downloadButton);
  });

  it('shows the transcript when language has changed', async () => {
    fetchMock.mock('https://example.com/vtt/fr.vtt', transcriptContent);
    useTimedTextTrack.getState().addMultipleResources(transcripts);
    useTimedTextTrack.getState().setSelectedTranscript(transcripts[1]);
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
    await screen.findByText('Download transcript');

    expect(
      screen.queryByText((content) =>
        content.includes('Bienvenue dans ce nouveau MOOC'),
      ),
    ).not.toBeInTheDocument();
    act(() => {
      useTimedTextTrack.getState().setSelectedTranscript(transcripts[0]);
    });
    expect(
      await screen.findByText((content) =>
        content.includes('Bienvenue dans ce nouveau MOOC'),
      ),
    ).toBeInTheDocument();
  });

  it('transcript should not be displayed when there is no transcript', () => {
    fetchMock.mock('https://example.com/vtt/fr.vtt', transcriptContent);
    useTimedTextTrack.getState().addMultipleResources(transcripts);
    useTimedTextTrack.getState().setSelectedTranscript(null);
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

    const languageSelect = screen.queryByRole('button', {
      name: 'Choose a language; Selected: [object Object]',
    });

    expect(languageSelect).not.toBeInTheDocument();
  });
});

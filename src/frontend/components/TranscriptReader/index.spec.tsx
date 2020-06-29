import { act, render } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { VTTCue } from 'vtt.js';
import 'vtt.js/lib/vttcue';

import { TranscriptReader } from '.';
import { useVideoProgress } from '../../data/stores/useVideoProgress';
import { Deferred } from '../../utils/tests/Deferred';
import { timedTextMode, uploadState } from '../../types/tracks';

jest.mock('vtt.js', () => ({
  WebVTT: {
    Parser: class {
      flush() {
        return [
          {
            endTime: 2.24,
            id: '1',
            startTime: 0.6,
            text: '-Bonjour. Bonjour à tous.',
          },
          {
            endTime: 5.28,
            id: '2',
            startTime: 2.56,
            text: 'Bienvenue dans ce nouveau MOOC\n"Du manager au leader".',
          },
        ].forEach((cue) => this.oncue(cue));
      }
      parse() {}
      oncue(cue: VTTCue) {}
    },
    StringDecoder: jest.fn(),
  },
}));

jest.mock('../TranscriptSentence', () => ({
  TranscriptSentence: ({ active, cue }: { active: boolean; cue: VTTCue }) => (
    <span>
      {active ? 'Active: ' : ''}
      {cue.text}
    </span>
  ),
}));

const transcript = {
  active_stamp: 234243242353,
  id: '1',
  is_ready_to_show: true,
  language: 'fr',
  mode: timedTextMode.TRANSCRIPT as timedTextMode.TRANSCRIPT,
  title: 'foo',
  upload_state: uploadState.READY,
  url: 'https://example.com/vtt/fr.vtt',
  video: '42',
};

describe('<TranscriptReader />', () => {
  let setPlayerCurrentTime: (time: number) => void;
  const VideoPlayer = () => {
    const videoProgress = useVideoProgress((state) => state);
    setPlayerCurrentTime = videoProgress.setPlayerCurrentTime;
    return null;
  };

  beforeEach(jest.clearAllMocks);
  afterEach(() => fetchMock.restore());

  it('fetches a transcript and renders its sentences, activating them when the player reaches them', async () => {
    const deferred = new Deferred();
    fetchMock.mock(transcript.url, deferred.promise);

    const { getByText } = render(<TranscriptReader transcript={transcript} />);
    await act(async () => deferred.resolve('OK'));

    expect(fetchMock.calls(transcript.url).length).toEqual(1),


    // Both cues are inactive
    getByText('-Bonjour. Bonjour à tous.');
    getByText(
      (content) =>
        content.startsWith('Bienvenue dans ce nouveau MOOC') &&
        content.includes('"Du manager au leader".'),
    );

    render(<VideoPlayer />);
    act(() => setPlayerCurrentTime(2));

    // Cue 1 is active, cue 2 is inactive
    getByText('Active: -Bonjour. Bonjour à tous.');
    getByText(
      (content) =>
        content.startsWith('Bienvenue dans ce nouveau MOOC') &&
        content.includes('"Du manager au leader".'),
    );

    act(() => setPlayerCurrentTime(4));

    // Cue 1 is inactive, cue 2 is active
    getByText('-Bonjour. Bonjour à tous.');
    getByText(
      (content) =>
        content.startsWith('Active: Bienvenue dans ce nouveau MOOC') &&
        content.includes('"Du manager au leader".'),
    );
  });
});

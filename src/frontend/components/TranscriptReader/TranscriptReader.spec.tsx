import { flushAllPromises } from '../../testSetup';

import { mount, shallow } from 'enzyme';
import fetchMock from 'fetch-mock';
import * as React from 'react';
import { VTTCue } from 'vtt.js';

import { TranscriptSentence } from '../TranscriptSentence/TranscriptSentence';
import { TranscriptReader } from './TranscriptReader';

const TranscriptContent = `
WEBVTT

1
00:00:00.600 --> 00:00:02.240
-Bonjour. Bonjour à tous.

2
00:00:02.560 --> 00:00:05.280
Bienvenue dans ce nouveau MOOC
"Du manager au leader".
`;

const cues: VTTCue[] = [
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
];

const transcript = {
  url: 'https://example.com/transcript.vtt',
} as any;

const mockParse = jest.fn();
const mockFlush = jest.fn();

jest.mock('vtt.js', () => ({
  WebVTT: {
    Parser: jest.fn(() => ({
      flush: mockFlush,
      parse: mockParse,
    })),
    StringDecoder: jest.fn(),
  },
}));

describe('<TranscriptReader />', () => {
  beforeEach(jest.clearAllMocks);
  afterEach(fetchMock.restore);

  it('fetch a transcript and parse it', async () => {
    fetchMock.mock(transcript.url, TranscriptContent);

    mount(<TranscriptReader transcript={transcript} currentTime={0} />);
    await flushAllPromises();

    expect(fetchMock.called()).toBe(true);
    expect(mockParse).toHaveBeenCalledWith(TranscriptContent);
    expect(mockFlush).toHaveBeenCalled();
  });

  it('render every cues', async () => {
    fetchMock.mock(transcript.url, TranscriptContent);

    const wrapper = shallow(
      <TranscriptReader transcript={transcript} currentTime={3} />,
    );
    await flushAllPromises();

    wrapper.setState({ cues });
    wrapper.update();

    expect(
      wrapper.contains(
        <TranscriptSentence key="1" cue={cues[0]} active={false} />,
      ),
    ).toBe(true);
    expect(
      wrapper.contains(
        <TranscriptSentence key="2" cue={cues[1]} active={true} />,
      ),
    ).toBe(true);
  });
});

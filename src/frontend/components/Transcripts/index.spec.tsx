import { cleanup, fireEvent, render, wait } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { Provider } from 'react-redux';

import { Transcripts } from '.';
import { bootstrapStore } from '../../data/bootstrapStore';
import { appState } from '../../types/AppData';
import { timedTextMode, uploadState } from '../../types/tracks';

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
    is_ready_to_play: true,
    language: 'fr',
    mode: timedTextMode.TRANSCRIPT as timedTextMode.TRANSCRIPT,
    upload_state: uploadState.READY,
    url: 'https://example.com/vtt/fr.vtt',
    video: '42',
  },
  {
    active_stamp: 1243401243953,
    id: '2',
    is_ready_to_play: true,
    language: 'en',
    mode: timedTextMode.TRANSCRIPT as timedTextMode.TRANSCRIPT,
    upload_state: uploadState.READY,
    url: 'https://example.com/vtt/en.vtt',
    video: '42',
  },
];

describe('<Transcripts />', () => {
  beforeEach(() =>
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
    ),
  );

  afterEach(cleanup);
  afterEach(fetchMock.restore);

  it('displays a list of available transcripts', async () => {
    const { getByText, queryByText } = render(
      <Provider
        store={bootstrapStore({
          jwt: '',
          resourceLinkid: '',
          state: appState.INSTRUCTOR,
          video: null,
        })}
      >
        <Transcripts transcripts={transcripts} />
      </Provider>,
    );
    await wait();

    getByText('Choose a language');
    expect(getByText('French').tagName).toEqual('OPTION');
    expect(getByText('English').tagName).toEqual('OPTION');
    expect(queryByText('Hide transcript')).toEqual(null);
  });

  it('shows the transcript when the user selects a language', async () => {
    fetchMock.mock('https://example.com/vtt/fr.vtt', transcriptContent);

    const { getByLabelText, getByText } = render(
      <Provider
        store={bootstrapStore({
          jwt: '',
          resourceLinkid: '',
          state: appState.INSTRUCTOR,
          video: null,
        })}
      >
        <Transcripts transcripts={transcripts} />
      </Provider>,
    );

    const select = getByLabelText('Show a transcript');
    fireEvent.change(select, { target: { value: 'fr' } });
    await wait();
    // TODO: make sure the transcript is displayed
    getByText('Hide transcript');
  });
});

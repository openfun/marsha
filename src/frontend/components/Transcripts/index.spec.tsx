import { fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { Transcripts } from '.';
import { timedTextMode, uploadState } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';

jest.mock('../../data/appData', () => ({
  appData: {
    jwt: 'foo',
  },
}));

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

  afterEach(() => fetchMock.restore());

  it('displays a list of available transcripts', async () => {
    render(
      wrapInIntlProvider(<Transcripts transcripts={transcripts} />),
    );
    await screen.findByText('Choose a language');

    expect(screen.getByText('French').tagName).toEqual('OPTION');
    expect(screen.getByText('English').tagName).toEqual('OPTION');
    expect(screen.queryByText('Hide transcript')).toEqual(null);
  });

  it('shows the transcript when the user selects a language', async () => {
    fetchMock.mock('https://example.com/vtt/fr.vtt', transcriptContent);

    const { getByLabelText, getByText } = render(
      wrapInIntlProvider(<Transcripts transcripts={transcripts} />),
    );

    const select = screen.getByLabelText('Show a transcript');
    fireEvent.change(select, { target: { value: '1' } });
    // TODO: make sure the transcript is displayed
    await screen.findByText('Hide transcript');
  });
});

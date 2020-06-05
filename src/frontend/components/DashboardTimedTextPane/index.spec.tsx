import {
  getByText as getByTextInContainer,
  render,
  screen,
} from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { DashboardTimedTextPane } from '.';
import { timedTextMode, uploadState } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';

jest.mock('../../data/appData', () => ({
  appData: {
    jwt: 'foo',
  },
}));

jest.mock('../../utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('<DashboardTimedTextPane />', () => {
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

  afterEach(jest.resetAllMocks);
  afterEach(() => fetchMock.restore());

  const video = {
    description: '',
    id: '43',
    is_ready_to_show: true,
    show_download: true,
    thumbnail: null,
    timed_text_tracks: [
      // We put only one out of two tracks here to make sure the request response is used
      {
        active_stamp: 2094219242,
        id: '142',
        is_ready_to_show: true,
        language: 'en',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/ttt/142',
        video: '43',
      },
    ],
    title: '',
    upload_state: uploadState.READY,
    urls: {
      manifests: {
        dash: 'https://example.com/dash',
        hls: 'https://example.com/hls',
      },
      mp4: {
        144: 'https://example.com/mp4/144',
        240: 'https://example.com/mp4/240',
        480: 'https://example.com/mp4/480',
        720: 'https://example.com/mp4/720',
        1080: 'https://example.com/mp4/1080',
      },
      thumbnails: {
        144: 'https://example.com/default_thumbnail/144',
        240: 'https://example.com/default_thumbnail/240',
        480: 'https://example.com/default_thumbnail/480',
        720: 'https://example.com/default_thumbnail/720',
        1080: 'https://example.com/default_thumbnail/1080',
      },
    },
  };

  it('gets the list of timedtexttracks and displays them by mode', async () => {
    fetchMock.get('/api/timedtexttracks/?limit=20&offset=0', [
      {
        active_stamp: 2094219242,
        id: '142',
        is_ready_to_show: true,
        language: 'en',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/ttt/142',
        video: '43',
      },
      {
        active_stamp: 2094219242,
        id: '144',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.CLOSED_CAPTIONING,
        upload_state: uploadState.READY,
        url: 'https://example.com/ttt/144',
        video: '43',
      },
    ]);

    render(
      wrapInIntlProvider(wrapInRouter(<DashboardTimedTextPane />)),
    );

    const closedCaptions = await screen.findByText('Closed captions');
    getByTextInContainer(closedCaptions.parentElement!, 'French');
    const subtitles = screen.getByText('Subtitles');
    getByTextInContainer(subtitles.parentElement!, 'English');
    screen.getByText('Transcripts');
  });

  it('redirects to the error view when the timedtexttrack list request fails', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/?limit=20&offset=0',
      Promise.reject(new Error('Failed!')),
    );
    const { getByText } = render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardTimedTextPane />, [
          {
            path: ERROR_COMPONENT_ROUTE(),
            render: ({ match }) => (
              <span>{`Error Component: ${match.params.code}`}</span>
            ),
          },
        ]),
      ),
    );

    await screen.findByText('Error Component: notFound');
    expect(report).toBeCalledWith(new Error('Failed!'));
  });
});

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
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';

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

  it('gets the list of timedtexttracks and displays them by mode', async () => {
    fetchMock.get('/api/timedtexttracks/?limit=20&offset=0', {
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          active_stamp: 2094219242,
          id: '142',
          is_ready_to_show: true,
          language: 'en',
          mode: timedTextMode.SUBTITLE,
          upload_state: uploadState.READY,
          source_url: 'https://example.com/ttt/142',
          url: 'https://example.com/ttt/142.vtt',
          video: '43',
        },
        {
          active_stamp: 2094219242,
          id: '144',
          is_ready_to_show: true,
          language: 'fr',
          mode: timedTextMode.CLOSED_CAPTIONING,
          upload_state: uploadState.READY,
          source_url: 'https://example.com/ttt/144',
          url: 'https://example.com/ttt/144.vtt',
          video: '43',
        },
      ],
    });

    render(wrapInIntlProvider(wrapInRouter(<DashboardTimedTextPane />)));

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
    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardTimedTextPane />, [
          {
            path: FULL_SCREEN_ERROR_ROUTE("notFound"),
            element: <span>{`Error Component: notFound`}</span>,
          },
        ]),
      ),
    );

    await screen.findByText('Error Component: notFound');
    expect(report).toBeCalledWith(new Error('Failed!'));
  });
});

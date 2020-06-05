import { cleanup, render, screen, act } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { DashboardVideoPane } from '.';
import { uploadState } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { Deferred } from '../../utils/tests/Deferred';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));
jest.mock('../../utils/errors/report', () => ({ report: jest.fn() }));

const { ERROR, PENDING, PROCESSING, UPLOADING, READY } = uploadState;

describe('<DashboardVideoPane />', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => fetchMock.restore());
  afterEach(jest.resetAllMocks);

  const video = {
    description: '',
    has_transcript: false,
    id: '43',
    is_ready_to_show: true,
    show_download: true,
    thumbnail: null,
    timed_text_tracks: [],
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
    should_use_subtitle_as_transcript: false,
  };

  it('redirects to error when it fails to fetch the video', async () => {
    fetchMock.mock('/api/videos/43/', () => {
      throw new Error('Failed request');
    });
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoPane video={{ ...video, upload_state: PROCESSING }} />,
          [
            {
              path: ERROR_COMPONENT_ROUTE(),
              render: ({ match }) => (
                <span>{`Error Component: ${match.params.code}`}</span>
              ),
            },
          ],
        ),
      ),
    );

    jest.advanceTimersByTime(1000 * 60 + 200);
    await screen.findByText('Error Component: notFound');

    expect(report).toHaveBeenCalledWith(new Error('Failed request'));
  });

  it('renders & starts polling for the video', async () => {
    let deferred = new Deferred();
    fetchMock.mock('/api/videos/43/', deferred.promise);

    const { getByText, queryByText, rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoPane video={{ ...video, upload_state: PROCESSING }} />,
        ),
      ),
    );

    // DashboardVideoPane shows the video as PROCESSING
    getByText('Processing');
    getByText(
      'Your video is currently processing. This may take up to an hour. Please come back later.',
    );
    expect(fetchMock.called()).not.toBeTruthy();

    // First backend call: the video is still processing
    jest.advanceTimersByTime(1000 * 60 + 200);
    await act(async () =>
      deferred.resolve(JSON.stringify({ ...video, upload_state: PROCESSING })),
    );

    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/43/');
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });
    getByText('Processing');
    getByText(
      'Your video is currently processing. This may take up to an hour. Please come back later.',
    );

    // The video will be ready in further responses
    fetchMock.restore();
    deferred = new Deferred();
    fetchMock.mock('/api/videos/43/', deferred.promise);

    // Second backend call
    jest.advanceTimersByTime(1000 * 60 + 200);
    await act(async () =>
      deferred.resolve(JSON.stringify({ ...video, upload_state: READY })),
    );

    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/43/');
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });

    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoPane video={{ ...video, upload_state: READY }} />,
        ),
      ),
    );

    expect(queryByText('Processing')).toEqual(null);
    expect(
      queryByText(
        'Your video is currently processing. This may take up to an hour. Please come back later.',
      ),
    ).toEqual(null);
    getByText((content) => content.startsWith('Ready'));
    getByText('Your video is ready to play.');
  });

  it('redirects to error when the video is in the error state and not `is_ready_to_show`', () => {
    const { getByText } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoPane
            video={{ ...video, is_ready_to_show: false, upload_state: ERROR }}
          />,
          [
            {
              path: ERROR_COMPONENT_ROUTE(),
              render: ({ match }) => (
                <span>{`Error Component: ${match.params.code}`}</span>
              ),
            },
          ],
        ),
      ),
    );

    getByText('Error Component: upload');
  });

  it('shows the dashboard when the video is in the error state but `is_ready_to_show`', async () => {
    const { getByText } = render(
      wrapInIntlProvider(
        <DashboardVideoPane
          video={{ ...video, is_ready_to_show: true, upload_state: ERROR }}
        />,
      ),
    );

    getByText((content) => content.startsWith('Error'));
    getByText(
      'There was an error with your video. Retry or upload another one.',
    );
  });

  it('shows the buttons only when the video is pending or ready', async () => {
    for (const state of Object.values(uploadState)) {
      const { getByText, queryByText } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardVideoPane
              video={{
                ...video,
                is_ready_to_show: false,
                upload_state: state,
              }}
            />,
          ),
        ),
      );

      switch (state) {
        case PENDING:
          getByText('Upload a video');
          break;

        case READY:
          getByText('Replace the video');
          getByText('Watch');
          break;

        default:
          expect(queryByText('Upload a video')).toEqual(null);
          expect(queryByText('Replace the video')).toEqual(null);
          expect(queryByText('Watch')).toEqual(null);
      }
      await cleanup();
    }
  });

  it('shows the thumbnail only when the video is ready', async () => {
    for (const state of Object.values(uploadState)) {
      const { getByAltText, queryByAltText } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardVideoPane
              video={{
                ...video,
                is_ready_to_show: false,
                upload_state: state,
              }}
            />,
          ),
        ),
      );
      if (state === READY) {
        getByAltText('Video thumbnail preview image.');
      } else {
        expect(queryByAltText('Video thumbnail preview image.')).toEqual(null);
      }
      await cleanup();
    }
  });

  it('shows the upload progress only when the video is uploading', () => {
    for (const state of Object.values(uploadState)) {
      const { getByText, queryByText } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardVideoPane
              video={{
                ...video,
                is_ready_to_show: false,
                upload_state: state,
              }}
            />,
          ),
        ),
      );
      if (state === UPLOADING) {
        getByText('0%');
      } else {
        expect(queryByText('0%')).toEqual(null);
      }
      cleanup();
    }
  });
});

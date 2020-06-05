import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { TimedTextListItem } from '.';
import { ERROR_COMPONENT_ROUTE } from '../../components/ErrorComponent/route';
import { timedTextMode, uploadState } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

jest.mock('../../data/appData', () => ({
  appData: {
    jwt: 'foo',
  },
}));

describe('<TimedTextListItem />', () => {
  jest.useFakeTimers();

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

  const video = {
    description: '',
    id: '43',
    is_ready_to_show: true,
    show_download: true,
    thumbnail: {
      active_stamp: 128748302847,
      id: '42',
      is_ready_to_show: true,
      upload_state: uploadState.READY,
      urls: {
        144: 'https://example.com/thumbnail/144',
        240: 'https://example.com/thumbnail/240',
        480: 'https://example.com/thumbnail/480',
        720: 'https://example.com/thumbnail/720',
        1080: 'https://example.com/thumbnail/1080',
      },
      video: '43',
    },
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
  };

  it('renders a track, showing its language and status', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <TimedTextListItem
            track={{
              active_stamp: 28271937429,
              id: '42',
              is_ready_to_show: true,
              language: 'fr',
              mode: timedTextMode.SUBTITLE,
              title: 'foo',
              upload_state: uploadState.READY,
              url: 'https://example.com/timedtexttrack/42',
              video: '142',
            }}
          />,
        ),
      ),
    );

    await screen.findByText('French');
    screen.getByText((content) => content.startsWith('Ready'));
    // No polling takes place as the track is already READY
    expect(
      fetchMock.called('/api/timedtexttracks/1/', { method: 'GET' }),
    ).not.toBeTruthy();
  });

  it('renders & never updates a timed text track that does not become READY', async () => {
    const track = {
      active_stamp: 28271937429,
      id: '1',
      is_ready_to_show: false,
      language: 'fr',
      mode: timedTextMode.SUBTITLE,
      title: 'foo',
      upload_state: uploadState.PROCESSING,
      url: 'https://example.com/timedtexttrack/1',
      video: '142',
    };
    fetchMock.mock('/api/timedtexttracks/1/', JSON.stringify(track), {
      method: 'GET',
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<TimedTextListItem track={track} />, [
          {
            path: ERROR_COMPONENT_ROUTE(),
            render: ({ match }) => (
              <span>{`Error Component: ${match.params.code}`}</span>
            ),
          },
        ]),
      ),
    );

    await screen.findByText('French');
    expect(
      fetchMock.called('/api/timedtexttracks/1/', { method: 'GET' }),
    ).not.toBeTruthy();

    // first backend call
    jest.advanceTimersByTime(1000 * 10 + 200);
    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/'),
    );

    expect(screen.queryByText('Ready')).toBeNull();
    screen.getByText('Processing');

    let timer: number = 15;

    for (let i = 2; i <= 20; i++) {
      timer = timer * i;
      jest.advanceTimersByTime(1000 * timer + 200);
      await waitFor(() => {});

      expect(fetchMock.calls('/api/timedtexttracks/1/').length).toEqual(i);
      expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/');
      expect(screen.queryByText('Ready')).toBeNull();
      screen.getByText('Processing');
    }
  });

  it('renders & polls the track until it is READY', async () => {
    for (const state of [
      uploadState.PENDING,
      uploadState.PROCESSING,
      uploadState.UPLOADING,
    ]) {
      const track = {
        active_stamp: 28271937429,
        id: '1',
        is_ready_to_show: false,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        title: 'foo',
        upload_state: state,
        url: 'https://example.com/timedtexttrack/1',
        video: '142',
      };
      fetchMock.mock('/api/timedtexttracks/1/', JSON.stringify(track));

      const { getByText, queryByText, rerender } = render(
        wrapInIntlProvider(wrapInRouter(<TimedTextListItem track={track} />)),
      );

      expect(
        fetchMock.called('/api/timedtexttracks/1/', { method: 'GET' }),
      ).not.toBeTruthy();

      // first backend call
      jest.advanceTimersByTime(1000 * 10 + 200);
      await waitFor(() =>
        expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/'),
      );

      expect(
        queryByText((content) => content.startsWith('Ready')),
      ).not.toBeTruthy();

      const updatedTrack = {
        ...track,
        upload_state: uploadState.READY,
      };
      fetchMock.restore();
      fetchMock.mock('/api/timedtexttracks/1/', JSON.stringify(updatedTrack));

      // Second backend call
      jest.advanceTimersByTime(1000 * 30 + 200);
      await waitFor(() => {});
      rerender(
        wrapInIntlProvider(
          wrapInRouter(<TimedTextListItem track={updatedTrack} />),
        ),
      );

      expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/');
      expect(
        queryByText((content) => content.startsWith('Processing')),
      ).not.toBeTruthy();
      getByText((content) => content.startsWith('Ready'));
      await cleanup();
      fetchMock.restore();
    }
  });

  describe('delete link', () => {
    it('issues a deleteTimedTextTrack request and deletes the track from the store', async () => {
      fetchMock.delete('/api/timedtexttracks/42/', 204);
      const { getByText } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <TimedTextListItem
              track={{
                active_stamp: 28271937429,
                id: '42',
                is_ready_to_show: true,
                language: 'fr',
                mode: timedTextMode.SUBTITLE,
                title: 'foo',
                upload_state: uploadState.READY,
                url: 'https://example.com/timedtexttrack/42',
                video: '142',
              }}
            />,
          ),
        ),
      );

      fireEvent.click(getByText('Delete'));
      await waitFor(() =>
        expect(
          fetchMock.called('/api/timedtexttracks/42/', { method: 'DELETE' }),
        ),
      );
      // TODO: check store deletion when we have a way to do so
    });
  });
});

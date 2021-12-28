import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { TimedTextListItem } from '.';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { timedTextMode, uploadState } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

jest.mock('../../data/appData', () => ({
  appData: {
    jwt: 'foo',
  },
}));

describe('<TimedTextListItem />', () => {
  beforeEach(() => {
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
    );
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    fetchMock.restore();
  });

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
              source_url: 'https://example.com/timedtext/source/42',
              url: 'https://example.com/timedtext/42.vtt',
              video: '142',
            }}
          />,
        ),
      ),
    );

    await screen.findByText('French');
    screen.getByText((content) => content.startsWith('Ready'));
    const downloadLink = screen.getByRole('link', { name: 'Download' });
    expect(downloadLink.getAttribute('href')).toEqual(
      'https://example.com/timedtext/source/42',
    );
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
      source_url: 'https://example.com/timedtext/source/1',
      url: 'https://example.com/timedtexttrack/1.vtt',
      video: '142',
    };

    {
      fetchMock.mock('/api/timedtexttracks/1/', JSON.stringify(track), {
        method: 'GET',
      });

      render(
        wrapInIntlProvider(
          wrapInRouter(<TimedTextListItem track={track} />, [
            {
              path: FULL_SCREEN_ERROR_ROUTE('notFound'),
              element: <span>{`Error Component: notFound`}</span>,
            },
          ]),
        ),
      );

      await screen.findByText('French');
      expect(
        fetchMock.called('/api/timedtexttracks/1/', { method: 'GET' }),
      ).not.toBeTruthy();

      // first backend call
      jest.runOnlyPendingTimers();
      await waitFor(() =>
        expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/'),
      );

      expect(screen.queryByText('Ready')).toBeNull();
      screen.getByText('Processing');
    }

    for (let i = 2; i <= 20; i++) {
      fetchMock.restore();
      fetchMock.mock('/api/timedtexttracks/1/', JSON.stringify(track), {
        method: 'GET',
      });

      jest.runOnlyPendingTimers();
      await waitFor(() => {
        // Expect only 1 call since we restore the mock before each one
        expect(fetchMock.calls('/api/timedtexttracks/1/')).toHaveLength(1);
      });
      expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/');
      expect(screen.queryByText('Ready')).toBeNull();
      screen.getByText('Processing');
    }
  });

  it('renders & polls the track until it is READY', async () => {
    for (const state of [uploadState.PENDING, uploadState.PROCESSING]) {
      const track = {
        active_stamp: 28271937429,
        id: '1',
        is_ready_to_show: false,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        title: 'foo',
        upload_state: state,
        source_url: 'https://example.com/timedtext/source/1',
        url: 'https://example.com/timedtext/1.vtt',
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
      jest.runOnlyPendingTimers();
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
      jest.runOnlyPendingTimers();
      rerender(
        wrapInIntlProvider(
          wrapInRouter(<TimedTextListItem track={updatedTrack} />),
        ),
      );

      await waitFor(() => {
        expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/1/');
      });
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
                source_url: 'https://example.com/timedtext/source/42',
                url: 'https://example.com/timedtext/42.vtt',
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

import { fireEvent, render, waitFor, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { appData } from '../../data/appData';
import { LiveModeType } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { DashboardVideoLiveConfigureButton } from '.';

jest.mock('../../data/appData', () => ({
  appData: {
    video: {
      description: 'Some description',
      has_transcript: false,
      id: '72',
      is_ready_to_show: true,
      show_download: false,
      thumbnail: null,
      timed_text_tracks: [],
      title: 'Some title',
      upload_state: 'pending',
      urls: {
        manifests: {
          dash: 'https://example.com/dash.mpd',
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {
          144: 'https://example.com/144p.mp4',
          240: 'https://example.com/240p.mp4',
          480: 'https://example.com/480p.mp4',
          720: 'https://example.com/720p.mp4',
          1080: 'https://example.com/1080p.mp4',
        },
        thumbnails: {
          144: 'https://example.com/144p.jpg',
          240: 'https://example.com/240p.jpg',
          480: 'https://example.com/480p.jpg',
          720: 'https://example.com/720p.jpg',
          1080: 'https://example.com/1080p.jpg',
        },
      },
      should_use_subtitle_as_transcript: false,
      live_state: null,
      live_info: {},
    },
  },
}));

describe('components/DashboardVideoLiveConfigureButton', () => {
  afterEach(() => fetchMock.restore());

  it('displays the configure live button', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveConfigureButton
            video={appData.video!}
            type={LiveModeType.RAW}
          />,
        ),
      ),
    );

    screen.getByRole('button', { name: 'Configure a live streaming' });
  });

  it('initiates a live video on click and redirect to the dashboard', async () => {
    fetchMock.mock(
      '/api/videos/72/initiate-live/',
      JSON.stringify({
        ...appData.video!,
        upload_state: 'live',
        live_state: 'pending',
        live_info: {
          medialive: {
            input: {
              endpoints: ['https://endpoint1', 'https://endpoint2'],
            },
          },
        },
      }),
      { method: 'POST' },
    );

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveConfigureButton
            video={appData.video!}
            type={LiveModeType.RAW}
          />,
          [
            {
              path: DASHBOARD_ROUTE(),
              render: () => <span>dashboard</span>,
            },
          ],
        ),
      ),
    );

    const button = screen.getByRole('button', {
      name: 'Configure a live streaming',
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(
        fetchMock.called('/api/videos/72/initiate-live/', {
          method: 'POST',
        }),
      ).toBe(true),
    );

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('fails to initiate a live video and redirects to error component', async () => {
    fetchMock.mock('/api/videos/72/initiate-live/', 400, { method: 'POST' });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveConfigureButton
            video={appData.video!}
            type={LiveModeType.RAW}
          />,
          [
            {
              path: FULL_SCREEN_ERROR_ROUTE('liveInit'),
              render: () => <span>error</span>,
            },
          ],
        ),
      ),
    );

    const button = screen.getByRole('button', {
      name: 'Configure a live streaming',
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(
        fetchMock.called('/api/videos/72/initiate-live/', {
          method: 'POST',
        }),
      ).toBe(true),
    );

    expect(screen.getByText('error')).toBeInTheDocument();
  });
});

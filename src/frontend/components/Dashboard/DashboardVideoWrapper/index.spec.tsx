import { render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Grommet } from 'grommet';
import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import * as websocket from 'data/websocket';
import { modelName } from 'types/models';
import {
  LiveModeType,
  liveState,
  timedTextMode,
  uploadState,
} from 'types/tracks';
import { timedTextMockFactory, videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { DashboardVideoWrapper } from '.';

const mockedAppName = modelName.VIDEOS;
jest.mock('data/appData', () => ({
  appData: {
    modelName: mockedAppName,
    video: {
      id: 'dd44',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: 'processing',
    },
  },
  getDecodedJwt: () => ({
    maintenance: false,
    permissions: {
      can_update: true,
    },
  }),
}));

const spiedInitVideoWebsocket = jest.spyOn(websocket, 'initVideoWebsocket');

describe('<DashboardVideoWrapper />', () => {
  beforeEach(() => {
    jest.useFakeTimers();

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

    const track1 = timedTextMockFactory({
      active_stamp: 2094219242,
      id: '142',
      is_ready_to_show: true,
      language: 'en',
      mode: timedTextMode.SUBTITLE,
      upload_state: uploadState.READY,
      source_url: 'https://example.com/ttt/142',
      url: 'https://example.com/ttt/142.vtt',
      video: '43',
    });
    const track2 = timedTextMockFactory({
      active_stamp: 2094219242,
      id: '144',
      is_ready_to_show: true,
      language: 'fr',
      mode: timedTextMode.CLOSED_CAPTIONING,
      upload_state: uploadState.PROCESSING,
      source_url: 'https://example.com/ttt/144',
      url: 'https://example.com/ttt/144.vtt',
      video: '43',
    });
    fetchMock.get('/api/timedtexttracks/?limit=20&offset=0', {
      count: 2,
      next: null,
      previous: null,
      results: [track1, track2],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders the live layout when upload state is pending', async () => {
    const video = videoMockFactory({
      live_type: LiveModeType.JITSI,
      live_state: liveState.IDLE,
      live_info: {
        jitsi: {
          external_api_url: 'some_url',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      upload_state: uploadState.PENDING,
    });

    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <Grommet>
              <Suspense fallback="loading...">
                <DashboardVideoWrapper video={video} />
              </Suspense>
            </Grommet>
          </QueryClientProvider>,
        ),
      ),
    );

    expect(spiedInitVideoWebsocket).toHaveBeenCalled();

    await screen.findByRole('button', { name: 'Pair an external device' });
  });

  it('renders the video layout when live_state is null', async () => {
    const video = videoMockFactory({
      live_state: null,
    });

    render(
      wrapInIntlProvider(wrapInRouter(<DashboardVideoWrapper video={video} />)),
    );

    await waitFor(() => expect(fetchMock.calls().length).toEqual(4));

    expect(spiedInitVideoWebsocket).toHaveBeenCalled();

    screen.getByRole('link', { name: 'Dashboard' });
    screen.getByRole('link', { name: 'Preview' });
    screen.getByRole('link', { name: 'Playlist' });

    screen.getByRole('heading', { name: 'Video status' });

    screen.getByRole('checkbox', { name: 'Allow video download' });

    screen.getByRole('button', { name: 'Replace this thumbnail' });
    screen.getByRole('button', { name: 'Replace the video' });
    screen.getByRole('button', { name: 'Watch' });

    screen.getByRole('heading', { name: 'Subtitles' });
    screen.getByRole('heading', { name: 'Transcripts' });
    screen.getByRole('heading', { name: 'Closed captions' });
    expect(
      screen.getAllByRole('button', { name: 'Upload the file' }).length,
    ).toBe(3);
  });

  it('renders the video layout when upload state is not pending', async () => {
    const video = videoMockFactory({
      live_type: LiveModeType.JITSI,
      live_state: liveState.STOPPED,
      live_info: {
        jitsi: {
          external_api_url: 'some_url',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      upload_state: uploadState.HARVESTING,
    });

    render(
      wrapInIntlProvider(wrapInRouter(<DashboardVideoWrapper video={video} />)),
    );

    screen.getByRole('link', { name: 'Dashboard' });
    screen.getByRole('link', { name: 'Playlist' });

    screen.getByText(
      'Your video is currently converting from a live video to a VOD. This may take up to an hour. You can close the window and come back later.',
    );
  });
});

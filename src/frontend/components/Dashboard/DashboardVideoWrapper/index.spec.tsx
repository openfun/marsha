import { cleanup, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';

import { LiveModaleConfigurationProvider } from 'data/stores/useLiveModale';
import * as websocket from 'data/websocket';
import { modelName } from 'types/models';
import {
  LiveModeType,
  liveState,
  timedTextMode,
  uploadState,
  Video,
} from 'types/tracks';
import { timedTextMockFactory, videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

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
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
  },
  getDecodedJwt: () => ({
    maintenance: false,
    permissions: {
      can_update: true,
    },
  }),
}));
jest.mock('components/DashboardVideoPaneStats', () => ({
  DashboardVideoPaneStats: (props: { video: Video }) => (
    <p>{`Stats for ${props.video.id}`}</p>
  ),
}));

jest.mock('components/DashboardVideoLive', () => ({
  DashboardVideoLive: () => <p>{`Dashboard video live`}</p>,
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
    for (const state of Object.values(liveState)) {
      if (state === liveState.ENDED) {
        continue;
      }
      const video = videoMockFactory({
        live_type: LiveModeType.JITSI,
        live_state: state,
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

      render(
        <LiveModaleConfigurationProvider value={null}>
          <Suspense fallback="loading...">
            <DashboardVideoWrapper video={video} />
          </Suspense>
        </LiveModaleConfigurationProvider>,
      );

      expect(spiedInitVideoWebsocket).toHaveBeenCalled();
      screen.getByText('Dashboard video live');

      cleanup();
      jest.clearAllMocks();
      fetchMock.restore();
    }
  });

  it('renders the video layout when live_state is null or ended', async () => {
    [null, liveState.ENDED].forEach(async (videoLiveState) => {
      const video = videoMockFactory({
        live_state: videoLiveState,
        upload_state: uploadState.PENDING,
      });

      render(<DashboardVideoWrapper video={video} />);

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

      cleanup();
      jest.clearAllMocks();
      fetchMock.restore();
    });
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
      upload_state: uploadState.READY,
    });

    render(<DashboardVideoWrapper video={video} />);

    await screen.findByRole('link', { name: 'Dashboard' });
    screen.getByRole('link', { name: 'Playlist' });

    screen.getByText('Your video is ready to play.');
    screen.getByText(`Stats for ${video.id}`);
  });
});

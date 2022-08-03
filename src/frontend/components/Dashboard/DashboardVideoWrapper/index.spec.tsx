import { cleanup, screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { useJwt } from 'data/stores/useJwt';
import { LiveModaleConfigurationProvider } from 'data/stores/useLiveModale';
import * as websocket from 'data/websocket';
import { DecodedJwt } from 'types/jwt';
import { modelName } from 'types/models';
import { LiveModeType, liveState, uploadState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { DashboardVideoWrapper } from '.';

const mockedAppName = modelName.VIDEOS;
jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
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
  }),
}));

jest.mock('components/DashboardVideoLive', () => ({
  DashboardVideoLive: () => <p>{`Dashboard video live`}</p>,
}));

jest.mock('components/DashboardVideo', () => ({
  DashboardVideo: () => <p>{`Video dashboard`}</p>,
}));

const spiedInitVideoWebsocket = jest.spyOn(websocket, 'initVideoWebsocket');

describe('<DashboardVideoWrapper />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          maintenance: false,
          permissions: {
            can_update: true,
          },
        } as DecodedJwt),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the live layout when upload state is pending', () => {
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
    }
  });

  it('renders the video layout when live_state is null or ended', () => {
    [null, liveState.ENDED].forEach((videoLiveState) => {
      const video = videoMockFactory({
        live_state: videoLiveState,
        upload_state: uploadState.PENDING,
      });

      render(<DashboardVideoWrapper video={video} />);

      expect(spiedInitVideoWebsocket).toHaveBeenCalled();

      screen.getAllByText('Video dashboard');

      cleanup();
      jest.clearAllMocks();
    });
  });

  it('renders the video layout when upload state is not pending', () => {
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

    screen.getAllByText('Video dashboard');
  });
});

import { cleanup, screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { LiveModaleConfigurationProvider } from 'data/stores/useLiveModale';
import * as websocket from 'data/websocket';
import { modelName } from 'types/models';
import { LiveModeType, liveState, uploadState } from 'lib-components';
import { videoMockFactory } from 'lib-components';
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

jest.mock('components/DashboardLive', () => ({
  DashboardLive: () => <p>{`Dashboard video live`}</p>,
}));

jest.mock('components/DashboardVOD', () => ({
  DashboardVOD: () => <p>{`VOD dashboard`}</p>,
}));

const spiedInitVideoWebsocket = jest.spyOn(websocket, 'initVideoWebsocket');

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: () => ({
    permissions: {
      can_update: true,
    },
  }),
  decodeJwt: () => ({}),
}));

describe('<DashboardVideoWrapper />', () => {
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

      screen.getAllByText('VOD dashboard');

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

    screen.getAllByText('VOD dashboard');
  });
});

import { cleanup, screen } from '@testing-library/react';
import {
  LiveModeType,
  liveState,
  modelName,
  uploadState,
} from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React, { Suspense } from 'react';

import { LiveModaleConfigurationProvider } from '@lib-video/hooks/useLiveModale';

import { DashboardVideoWrapper } from '.';

const mockedAppName = modelName.VIDEOS;
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
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
  useCurrentResourceContext: () => ({
    permissions: {
      can_update: true,
    },
  }),
  decodeJwt: () => ({}),
}));

jest.mock('components/live', () => ({
  LiveTeacherDashboard: () => <p>Dashboard video live</p>,
}));

jest.mock('components/vod', () => ({
  VODTeacherDashboard: () => <p>VOD dashboard</p>,
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
        is_live: true,
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

      expect(screen.getByText('Dashboard video live')).toBeInTheDocument();

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

      expect(screen.getAllByText('VOD dashboard')).toHaveLength(1);

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

    expect(screen.getAllByText('VOD dashboard')).toHaveLength(1);
  });
});

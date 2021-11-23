import React from 'react';
import { render, screen } from '@testing-library/react';

import { LivePanelDetail } from 'data/stores/useLivePanelState';
import { LiveModeType, liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { LiveVideoWrapper } from '.';

jest.mock('components/DashboardVideoLiveJitsi', () => () => (
  <p>dashboard video live jitsi</p>
));
jest.mock('components/VideoPlayer', () => () => <p>video player</p>);
const mockVideo = videoMockFactory();
jest.mock('data/appData', () => ({
  appData: {
    video: mockVideo,
  },
  getDecodedJwt: () => ({
    permissions: {
      can_update: false,
    },
  }),
}));

const mockSetPanel = jest.fn();
const mockSetConfig = jest.fn();
jest.mock('data/stores/useLivePanelState', () => ({
  ...jest.requireActual('data/stores/useLivePanelState'),
  useLivePanelState: () => ({
    isPanelOpen: false,
    setPanelVisibility: mockSetPanel,
    configPanel: mockSetConfig,
  }),
}));

describe('<LiveVideoWrapper />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('render jitsi when user when on_stage', () => {
    const video = videoMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });
    const Compo = (
      <LiveVideoWrapper video={video} configuration={{ type: 'on_stage' }} />
    );

    render(wrapInRouter(wrapInIntlProvider(Compo)));

    screen.getByText('dashboard video live jitsi');
    expect(screen.queryByText('video player')).toBeNull();
  });

  it('render video player when user is a viewer', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });
    const Compo = (
      <LiveVideoWrapper
        video={video}
        configuration={{ type: 'viewer', playerType: 'videojs' }}
      />
    );

    render(wrapInRouter(wrapInIntlProvider(Compo)));

    screen.getByText('video player');
    expect(screen.queryByText('dashboard video live jitsi')).toBeNull();
  });

  it('reset the live chat panel store when mouting', () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });
    const Compo = (
      <LiveVideoWrapper
        video={video}
        configuration={{ type: 'viewer', playerType: 'videojs' }}
      />
    );

    render(wrapInRouter(wrapInIntlProvider(Compo)));

    expect(mockSetPanel).toHaveBeenCalled();
    expect(mockSetPanel).toHaveBeenCalledTimes(1);
    expect(mockSetPanel).toHaveBeenCalledWith(false);

    expect(mockSetConfig).toHaveBeenCalled();
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenCalledWith(
      [LivePanelDetail.CHAT],
      LivePanelDetail.CHAT,
    );
  });
});

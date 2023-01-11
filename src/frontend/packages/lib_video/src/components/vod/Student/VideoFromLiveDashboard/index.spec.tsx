import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  decodeJwt,
  liveState,
  PersistentStore,
  useCurrentResourceContext,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { LivePanelItem, useLivePanelState } from 'hooks/useLivePanelState';

import { VideoFromLiveDashboard } from '.';

const mockVideo = videoMockFactory({
  urls: {
    manifests: {
      hls: 'https://example.com/hls.m3u8',
    },
    mp4: {
      144: 'https://example.com/144p.mp4',
      1080: 'https://example.com/1080p.mp4',
    },
    thumbnails: {
      144: 'https://example.com/thumbnail/144p.jpg',
      1080: 'https://example.com/thumbnail/1080p.jpg',
    },
  },
  live_info: {
    medialive: {
      input: {
        endpoints: [
          'rtmp://1.2.3.4:1935/stream-key-primary',
          'rtmp://4.3.2.1:1935/stream-key-secondary',
        ],
      },
    },
  },
  live_state: liveState.ENDED,
  xmpp: {
    bosh_url: null,
    converse_persistent_store: PersistentStore.LOCALSTORAGE,
    conference_url: 'conference-url',
    jid: 'jid',
    prebind_url: 'prebind_url',
    websocket_url: null,
  },
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  getResource: jest.fn().mockResolvedValue(null),
  useAppConfig: () => ({
    attendanceDelay: 10000,
    video: mockVideo,
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
  useCurrentResourceContext: jest.fn(),
  decodeJwt: jest.fn(),
}));

jest.mock('Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));

jest.mock('components/ConverseInitializer', () => ({
  ConverseInitializer: ({ children }: { children: React.ReactNode }) => {
    return children;
  },
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;
const mockedDecodeJwt = decodeJwt as jest.MockedFunction<typeof decodeJwt>;

describe('<LiveToVODDashboard />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        } as any),
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.clearAllMocks();
  });

  it('renders the component', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: { can_update: false },
      },
    ] as any);
    mockedDecodeJwt.mockReturnValue({} as any);

    render(
      <VideoFromLiveDashboard
        video={mockVideo}
        playerType="player_type"
        timedTextTracks={[]}
        socketUrl="some_url"
      />,
    );

    // Displays video
    expect(screen.getByRole('video')).toBeInTheDocument();

    // Displays Chat and Chat only
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
    ]);
  });
});

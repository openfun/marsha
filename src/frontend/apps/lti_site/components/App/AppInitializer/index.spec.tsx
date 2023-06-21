import { screen } from '@testing-library/react';
import {
  useJwt,
  useMaintenance,
  useSentry,
  useVideo,
  useTimedTextTrack,
  useThumbnail,
  useSharedLiveMedia,
  useDocument,
  useP2PLiveConfig,
} from 'lib-components';
import { useAttendance } from 'lib-video';
import React from 'react';

import render from 'utils/tests/render';

import { AppInitializer } from '.';

const mockedVideo = {
  id: 'my-video-id',
  timed_text_tracks: [{ id: 'my-timed-text-track-id' }],
  thumbnail: { id: 'my-thumbnail-id' },
  shared_live_medias: [{ id: 'my-shared-live-media-id' }],
};
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    flags: {
      sentry: true,
    },
    sentry_dsn: 'some sentry dns',
    video: mockedVideo,
    document: { id: 'my-document-id' },
    attendanceDelay: 6,
    p2p: {
      live_enabled: true,
      live_stun_server_urls: ['stun.example.com'],
      live_web_torrent_tracker_urls: ['tracker.example.com'],
    },
  }),
  decodeJwt: () => ({
    maintenance: true,
  }),
}));

describe('<AppInitializer />', () => {
  it('initializes stores before render content', async () => {
    useSentry.setState({ setSentry: ()=> useSentry.setState({ isSentryReady: true }) });

    expect(useP2PLiveConfig.getState().isP2PEnabled).toEqual(false);
    expect(useP2PLiveConfig.getState().stunServersUrls).toEqual([]);
    expect(useP2PLiveConfig.getState().webTorrentServerTrackerUrls).toEqual([]);
    expect(useSentry.getState().isSentryReady).toEqual(false);
    expect(useVideo.getState().videos).toEqual({});
    expect(useTimedTextTrack.getState().timedtexttracks).toEqual({});
    expect(useThumbnail.getState().thumbnails).toEqual({});
    expect(useSharedLiveMedia.getState().sharedlivemedias).toEqual({});
    expect(useDocument.getState().documents).toEqual({});
    expect(useAttendance.getState().delay).toEqual(10000);
    expect(useMaintenance.getState().isActive).toEqual(false);
    expect(useJwt.getState().getJwt()).toBeUndefined();
    expect(useJwt.getState().getRefreshJwt()).toBeUndefined();

    render(
      <AppInitializer jwt="jwt" refresh_token="refresh_token">
        <span>some cool content</span>
      </AppInitializer>,
    );

    await screen.findByText('some cool content');

    expect(useP2PLiveConfig.getState().isP2PEnabled).toEqual(true);
    expect(useP2PLiveConfig.getState().stunServersUrls).toEqual(['stun.example.com']);
    expect(useP2PLiveConfig.getState().webTorrentServerTrackerUrls).toEqual([
      'tracker.example.com',
    ])
    expect(useSentry.getState().isSentryReady).toEqual(true);
    expect(useVideo.getState().videos).toEqual({
      ['my-video-id']: mockedVideo,
    });
    expect(useTimedTextTrack.getState().timedtexttracks).toEqual({
      ['my-timed-text-track-id']: { id: 'my-timed-text-track-id' },
    });
    expect(useThumbnail.getState().thumbnails).toEqual({
      ['my-thumbnail-id']: { id: 'my-thumbnail-id' },
    });
    expect(useSharedLiveMedia.getState().sharedlivemedias).toEqual({
      ['my-shared-live-media-id']: { id: 'my-shared-live-media-id' },
    });
    expect(useDocument.getState().documents).toEqual({
      ['my-document-id']: { id: 'my-document-id' },
    });
    expect(useAttendance.getState().delay).toEqual(6);
    expect(useMaintenance.getState().isActive).toEqual(true);
    expect(useJwt.getState().getJwt()).toEqual('jwt');
    expect(useJwt.getState().getRefreshJwt()).toEqual('refresh_token');
  });
});

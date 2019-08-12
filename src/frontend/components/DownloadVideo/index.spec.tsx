import { render } from '@testing-library/react';
import * as React from 'react';

import { DownloadVideo } from '.';
import { Video } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';

describe('<DownloadVideo />', () => {
  const video = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_play: true,
    title: 'Some title',
    upload_state: 'ready',
    urls: {
      manifests: {
        dash: 'https://example.com/dash.mpd',
        hls: 'https://example.com/hls.m3u8',
      },
      mp4: {
        480: 'https://example.com/480p.mp4',
        720: 'https://example.com/720p.mp4',
        1080: 'https://example.com/1080p.mp4',
      },
      thumbnails: {
        720: 'https://example.com/144p.jpg',
      },
    },
  } as Video;
  it('renders all video links', () => {
    const { getByText } = render(
      wrapInIntlProvider(<DownloadVideo video={video} />),
    );

    getByText('1080p');
    getByText('720p');
    getByText('480p');
  });
});

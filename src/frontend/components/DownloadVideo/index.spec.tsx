import { render } from '@testing-library/react';
import * as React from 'react';

import { DownloadVideo } from '.';
import { Video } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';

describe('<DownloadVideo />', () => {
  it('renders all video links', () => {
    const video = {
      description: 'Some description',
      id: 'video-id',
      is_ready_to_show: true,
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

    const { getByText } = render(
      wrapInIntlProvider(<DownloadVideo video={video} />),
    );

    getByText('1080p');
    getByText('720p');
    getByText('480p');
  });

  it('renders video links available from resolutions field', () => {
    const video = {
      description: 'Some description',
      id: 'video-id',
      is_ready_to_show: true,
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
        },
        thumbnails: {
          720: 'https://example.com/144p.jpg',
        },
      },
    } as Video;

    const { getByText, queryByText } = render(
      wrapInIntlProvider(<DownloadVideo video={video} />),
    );

    expect(queryByText(/1080p/i)).toEqual(null);
    getByText('720p');
    getByText('480p');
  });
  it('returns nothing if there is no compatible resolutions', () => {
    const video = {
      description: 'Some description',
      id: 'video-id',
      is_ready_to_show: true,
      title: 'Some title',
      upload_state: 'ready',
      urls: {
        manifests: {
          dash: 'https://example.com/dash.mpd',
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {
          144: 'https://example.com/144p.mp4',
          240: 'https://example.com/240p.mp4',
        },
        thumbnails: {
          240: 'https://example.com/240p.jpg',
        },
      },
    } as Video;

    const { container } = render(
      wrapInIntlProvider(<DownloadVideo video={video} />),
    );
    expect(container.firstChild).toBeNull();
  });
});

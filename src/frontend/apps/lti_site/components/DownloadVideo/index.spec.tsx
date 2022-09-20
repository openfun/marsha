import { fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';

import { XAPI_ENDPOINT } from 'settings';
import { uploadState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { DownloadVideo } from '.';

jest.mock('video.js', () => ({
  __esModule: true,
  default: {
    getPlayers: () => [
      {
        duration: () => 600,
      },
    ],
  },
}));

describe('<DownloadVideo />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'foo',
      getDecodedJwt: () => ({ session_id: 'abcd' } as any),
    });
  });

  afterEach(() => fetchMock.reset());

  it('renders all video links', () => {
    const video = videoMockFactory({
      description: 'Some description',
      id: 'video-id',
      is_ready_to_show: true,
      title: 'Some title',
      upload_state: uploadState.READY,
      urls: {
        manifests: {
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
    });

    render(<DownloadVideo urls={video.urls!} />);

    screen.getByRole('link', { name: '1080p' });
    screen.getByRole('link', { name: '720p' });
    screen.getByRole('link', { name: '480p' });
  });

  it('renders video links available from resolutions field', () => {
    const video = videoMockFactory({
      description: 'Some description',
      id: 'video-id',
      is_ready_to_show: true,
      title: 'Some title',
      upload_state: uploadState.READY,
      urls: {
        manifests: {
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
    });

    render(<DownloadVideo urls={video.urls!} />);

    expect(screen.queryByText(/1080p/i)).toEqual(null);
    screen.getByRole('link', { name: '720p' });
    screen.getByRole('link', { name: '480p' });
  });

  it('returns nothing if there is no compatible resolutions', () => {
    const video = videoMockFactory({
      description: 'Some description',
      id: 'video-id',
      is_ready_to_show: true,
      title: 'Some title',
      upload_state: uploadState.READY,
      urls: {
        manifests: {
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
    });

    const { elementContainer: container } = render(
      <DownloadVideo urls={video.urls!} />,
    );
    expect(container!.firstChild).toBeNull();
  });

  it('sends the xapi downloaded statement when a link is clicked', async () => {
    fetchMock.mock(`${XAPI_ENDPOINT}/video/`, 204);
    const video = videoMockFactory({
      description: 'Some description',
      id: 'video-id',
      is_ready_to_show: true,
      title: 'Some title',
      upload_state: uploadState.READY,
      urls: {
        manifests: {
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
    });

    render(<DownloadVideo urls={video.urls!} />);

    screen.getByRole('link', { name: '1080p' });
    screen.getByRole('link', { name: '720p' });
    const toDownloadLink = screen.getByRole('link', { name: '480p' });

    fireEvent.click(toDownloadLink);
    fireEvent.blur(window);

    await waitFor(() =>
      expect(fetchMock.called(`${XAPI_ENDPOINT}/video/`)).toBe(true),
    );
  });
});

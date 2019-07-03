import { cleanup, render } from '@testing-library/react';
import React from 'react';

import { DashboardThumbnailDisplay } from '.';

describe('<DashboardThumbnailDisplay />', () => {
  afterEach(cleanup);

  it('display images from thumbnail resource when ready', () => {
    const thumbnail = {
      id: 42,
      is_ready_to_display: true,
      urls: {
        144: 'https://example.com/thumbnail/144.jpg',
        240: 'https://example.com/thumbnail/240.jpg',
        480: 'https://example.com/thumbnail/480.jpg',
        720: 'https://example.com/thumbnail/720.jpg',
        1080: 'https://example.com/thumbnail/1080.jpg',
      },
    } as any;

    const video = {
      id: 43,
      urls: {
        thumbnails: {
          urls: {
            144: 'https://example.com/video/thumbnail/144.jpg',
            240: 'https://example.com/video/thumbnail/240.jpg',
            480: 'https://example.com/video/thumbnail/480.jpg',
            720: 'https://example.com/video/thumbnail/720.jpg',
            1080: 'https://example.com/video/thumbnail/1080.jpg',
          },
        },
      },
    } as any;

    const { container } = render(
      <DashboardThumbnailDisplay video={video} thumbnail={thumbnail} />,
    );

    const img = container.querySelector('img')!;

    expect(img.getAttribute('src')).toEqual(
      'https://example.com/thumbnail/144.jpg',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/thumbnail/144.jpg 256w, https://example.com/thumbnail/240.jpg 426w, https://example.com/thumbnail/480.jpg 854w, https://example.com/thumbnail/720.jpg 1280w, https://example.com/thumbnail/1080.jpg 1920w',
    );
  });

  it('display images from video resource when thumbnail resource is not ready', () => {
    const thumbnail = {
      id: 42,
      is_ready_to_display: false,
      urls: {
        144: 'https://example.com/thumbnail/144.jpg',
        240: 'https://example.com/thumbnail/240.jpg',
        480: 'https://example.com/thumbnail/480.jpg',
        720: 'https://example.com/thumbnail/720.jpg',
        1080: 'https://example.com/thumbnail/1080.jpg',
      },
    } as any;

    const video = {
      id: 43,
      urls: {
        thumbnails: {
          144: 'https://example.com/video/thumbnail/144.jpg',
          240: 'https://example.com/video/thumbnail/240.jpg',
          480: 'https://example.com/video/thumbnail/480.jpg',
          720: 'https://example.com/video/thumbnail/720.jpg',
          1080: 'https://example.com/video/thumbnail/1080.jpg',
        },
      },
    } as any;

    const { container } = render(
      <DashboardThumbnailDisplay video={video} thumbnail={thumbnail} />,
    );

    const img = container.querySelector('img')!;

    expect(img.getAttribute('src')).toEqual(
      'https://example.com/video/thumbnail/144.jpg',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/video/thumbnail/144.jpg 256w, https://example.com/video/thumbnail/240.jpg 426w, https://example.com/video/thumbnail/480.jpg 854w, https://example.com/video/thumbnail/720.jpg 1280w, https://example.com/video/thumbnail/1080.jpg 1920w',
    );
  });

  it('display images from video resource when thumbnail resource is null', () => {
    const thumbnail = null;

    const video = {
      id: 43,
      urls: {
        thumbnails: {
          144: 'https://example.com/video/thumbnail/144.jpg',
          240: 'https://example.com/video/thumbnail/240.jpg',
          480: 'https://example.com/video/thumbnail/480.jpg',
          720: 'https://example.com/video/thumbnail/720.jpg',
          1080: 'https://example.com/video/thumbnail/1080.jpg',
        },
      },
    } as any;

    const { container } = render(
      <DashboardThumbnailDisplay video={video} thumbnail={thumbnail} />,
    );

    const img = container.querySelector('img')!;

    expect(img.getAttribute('src')).toEqual(
      'https://example.com/video/thumbnail/144.jpg',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/video/thumbnail/144.jpg 256w, https://example.com/video/thumbnail/240.jpg 426w, https://example.com/video/thumbnail/480.jpg 854w, https://example.com/video/thumbnail/720.jpg 1280w, https://example.com/video/thumbnail/1080.jpg 1920w',
    );
  });
});

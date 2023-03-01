import { screen } from '@testing-library/react';
import { thumbnailMockFactory, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';

import Video from './Video';

describe('<Video />', () => {
  test('renders Video', () => {
    const video = videoMockFactory({
      id: '4321',
      title: 'New video title',
      description: 'New video description',
      playlist: {
        ...videoMockFactory().playlist,
        title: 'New playlist title',
      },
    });
    render(<Video video={video} />);

    expect(
      screen.getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle(
      `background: url(https://example.com/default_thumbnail/240) no-repeat center / cover`,
    );
    expect(screen.getByText('New video title')).toBeInTheDocument();
    expect(screen.getByText('New video description')).toBeInTheDocument();
    expect(screen.getByText('New playlist title')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/my-contents/videos/4321',
    );
  });

  test('renders thumbnail', () => {
    const video = videoMockFactory({
      id: '4321',
      title: 'New video title',
      description: 'New video description',
      playlist: {
        ...videoMockFactory().playlist,
        title: 'New playlist title',
      },
      thumbnail: {
        ...thumbnailMockFactory(),
        urls: {
          ...thumbnailMockFactory().urls,
          240: 'https://example.com/240',
        },
      },
    });
    render(<Video video={video} />);

    expect(
      screen.getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle(
      `background: url(https://example.com/240) no-repeat center / cover`,
    );
  });
});

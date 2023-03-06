import { screen } from '@testing-library/react';
import { thumbnailMockFactory, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';

import Live from './Live';

describe('<Live />', () => {
  test('renders Live', () => {
    const live = videoMockFactory({
      id: '4321',
      title: 'New live title',
      description: 'New live description',
      playlist: {
        ...videoMockFactory().playlist,
        title: 'New playlist title',
      },
    });
    render(<Live live={live} />);

    expect(
      screen.getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle(
      `background: url(https://example.com/default_thumbnail/240) no-repeat center / cover`,
    );
    expect(screen.getByText('New live title')).toBeInTheDocument();
    expect(screen.getByText('New live description')).toBeInTheDocument();
    expect(screen.getByText('New playlist title')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/my-contents/lives/4321',
    );
  });

  test('renders thumbnail', () => {
    const live = videoMockFactory({
      id: '4321',
      title: 'New live title',
      description: 'New live description',
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
    render(<Live live={live} />);

    expect(
      screen.getByRole('img', {
        name: 'thumbnail',
      }),
    ).toHaveStyle(
      `background: url(https://example.com/240) no-repeat center / cover`,
    );
  });
});

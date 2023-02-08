import { screen } from '@testing-library/react';
import { videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';

import Video from './Video';

describe('<Video />', () => {
  test('renders Video', () => {
    const video = videoMockFactory({
      id: '4321',
      title: 'Nouvelle video title',
      description: 'Nouvelle video description',
      playlist: {
        ...videoMockFactory().playlist,
        title: 'Nouvelle playlist title',
      },
    });
    render(<Video video={video} />);

    expect(screen.getByText('Nouvelle video title')).toBeInTheDocument();
    expect(screen.getByText('Nouvelle video description')).toBeInTheDocument();
    expect(screen.getByText('Nouvelle playlist title')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/my-contents/videos/4321',
    );
  });
});

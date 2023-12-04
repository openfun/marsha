import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { thumbnailMockFactory, videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import { act } from 'react-dom/test-utils';

import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import Video from './Video';

describe('<Video />', () => {
  it('renders Video', () => {
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

  it('renders thumbnail', () => {
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

  it('successfully selects and unselects a video', async () => {
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

    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: [],
      }),
    );

    const videoCardCheckBox = screen.getByRole('checkbox');
    expect(videoCardCheckBox).not.toBeChecked();

    const card = screen.getByRole('contentinfo');
    await userEvent.click(card);
    await waitFor(() => expect(videoCardCheckBox).toBeChecked());
    await userEvent.click(card);
    await waitFor(() => expect(videoCardCheckBox).not.toBeChecked());
  });
});

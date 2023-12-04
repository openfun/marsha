import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { thumbnailMockFactory, videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import { act } from 'react-dom/test-utils';

import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import Live from './Live';

describe('<Live />', () => {
  it('renders Live', () => {
    const live = videoMockFactory({
      id: '4321',
      title: 'New webinar title',
      description: 'New webinar description',
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
    expect(screen.getByText('New webinar title')).toBeInTheDocument();
    expect(screen.getByText('New webinar description')).toBeInTheDocument();
    expect(screen.getByText('New playlist title')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/my-contents/webinars/4321',
    );
  });

  it('renders thumbnail', () => {
    const live = videoMockFactory({
      id: '4321',
      title: 'New webinar title',
      description: 'New webinar description',
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

  it('successfully selects and unselects a webinar', async () => {
    const live = videoMockFactory({
      id: '4321',
      title: 'New video title',
      description: 'New video description',
      is_live: true,
      playlist: {
        ...videoMockFactory().playlist,
        title: 'New playlist title',
      },
    });
    render(<Live live={live} />);

    act(() =>
      useSelectFeatures.setState({
        isSelectionEnabled: true,
        selectedItems: [],
      }),
    );

    const liveCardCheckBox = screen.getByRole('checkbox');
    expect(liveCardCheckBox).not.toBeChecked();

    const card = screen.getByRole('contentinfo');
    await userEvent.click(card);
    await waitFor(() => expect(liveCardCheckBox).toBeChecked());
    await userEvent.click(card);
    await waitFor(() => expect(liveCardCheckBox).not.toBeChecked());
  });
});

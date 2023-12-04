import { getDefaultNormalizer, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { classroomMockFactory } from 'lib-classroom/tests';
import { playlistMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import ClassRoom from './ClassRoomItem';

const classroom = {
  welcome_text: 'Welcome!',
  description: 'Nouvelle Classroom description',
  title: 'Nouvelle Classroom title',
  starting_at: '2022-10-18T11:00:00Z',
  estimated_duration: '01:23:00',
  playlist: {
    ...playlistMockFactory(),
    title: 'Nouvelle Playlist title',
  },
  id: '1234',
};

describe('<ClassRoom />', () => {
  it('renders ClassRoom', () => {
    render(<ClassRoom classroom={classroomMockFactory(classroom)} />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/my-contents/classroom/1234',
    );
    expect(screen.getByText(/Welcome!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Nouvelle Classroom description/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nouvelle Classroom title/i)).toBeInTheDocument();
    expect(
      screen.getByText('10/18/2022  ·  11:00:00 AM', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('01:23:00')).toBeInTheDocument();
    expect(screen.getByText('Nouvelle Playlist title')).toBeInTheDocument();
  });

  it('successfully selects and unselects a classroom', async () => {
    const classroom = classroomMockFactory({
      id: '4321',
      title: 'New classroom title',
      description: 'New video description',
      playlist: {
        ...classroomMockFactory().playlist,
        title: 'New playlist title',
      },
    });
    render(<ClassRoom classroom={classroom} />);

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

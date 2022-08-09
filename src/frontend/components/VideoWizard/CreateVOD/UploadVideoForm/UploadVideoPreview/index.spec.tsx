import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import render from 'utils/tests/render';
import { UploadVideoPreview } from '.';

const mockedOnClickRemoveButton = jest.fn();

describe('<UploadVideoPreview />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders UploadVideoPreview and clicks on the remove button', () => {
    const { container } = render(
      <UploadVideoPreview
        onClickRemoveButton={mockedOnClickRemoveButton}
        videoSrc={'/data/blob/video'}
      />,
    );

    const video = container.getElementsByTagName('video')[0];
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('src', '/data/blob/video');
    const removeButton = screen.getByRole('button', {
      name: 'Click on this button to remove the selected video.',
    });
    act(() => userEvent.click(removeButton));
    expect(mockedOnClickRemoveButton).toHaveBeenCalledTimes(1);
  });

  it('renders UploadVideoPreview, plays the video and then hovers it', () => {
    const { container } = render(
      <UploadVideoPreview
        onClickRemoveButton={mockedOnClickRemoveButton}
        videoSrc={'/data/blob/video'}
      />,
    );

    const video = container.getElementsByTagName('video')[0];
    screen.getByRole('button', {
      name: 'Click on this button to remove the selected video.',
    });
    fireEvent.play(video);
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to remove the selected video.',
      }),
    ).not.toBeInTheDocument();
    act(() => userEvent.hover(video));
    screen.getByRole('button', {
      name: 'Click on this button to remove the selected video.',
    });
    act(() => userEvent.unhover(video));
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to remove the selected video.',
      }),
    ).not.toBeInTheDocument();
  });
});

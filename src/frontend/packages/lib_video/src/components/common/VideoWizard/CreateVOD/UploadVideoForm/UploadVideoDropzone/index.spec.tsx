/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { render } from 'lib-tests';

import { UploadVideoDropzone } from '.';

const mockedSetVideoFile = jest.fn();

describe('<UploadVideoDropzone />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders UploadVideoDropzone and uploads a file', async () => {
    const { container } = render(
      <UploadVideoDropzone setVideoFile={mockedSetVideoFile} />,
    );

    const dashedBox =
      container.firstElementChild!.children[1].firstElementChild;
    expect(dashedBox).toHaveStyle(
      `background-color: ${normalizeColor('bg-select', theme)}`,
    );

    const svg = container.getElementsByTagName('path')[0];
    expect(svg).toHaveStyle(`fill: #b4cff2`);

    const text = screen.getByText('Add a video or drag & drop it');
    expect(text).toHaveStyle('color: #b4cff2');

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const hiddenInput = screen.getByTestId('input-video-test-id');

    await userEvent.upload(hiddenInput, file);

    await waitFor(() => expect(mockedSetVideoFile).toHaveBeenCalledTimes(1));
    expect(mockedSetVideoFile).toHaveBeenCalledWith(file);
  });

  it('renders UploadVideoDropzone and drags a file over', async () => {
    const { container } = render(
      <UploadVideoDropzone setVideoFile={mockedSetVideoFile} />,
    );

    const dashedBox =
      container.firstElementChild!.children[1].firstElementChild;
    const svg = container.getElementsByTagName('path')[0];
    const text = screen.getByText('Add a video or drag & drop it');

    expect(dashedBox).toHaveStyle(
      `background-color: ${normalizeColor('bg-select', theme)}`,
    );
    expect(svg).toHaveStyle('fill: #b4cff2');
    expect(text).toHaveStyle('color: #b4cff2');

    fireEvent.dragEnter(
      container.querySelector('input[type="file"]')!,
      new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' }),
    );
    await waitFor(() =>
      expect(dashedBox).toHaveStyle('background-color: #b4cff2'),
    );
    expect(svg).toHaveStyle(`fill:  #ffffff`);
    expect(text).toHaveStyle(`color: ${normalizeColor('white', theme)}`);

    fireEvent.dragLeave(
      container.querySelector('input[type="file"]')!,
      new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' }),
    );
    await waitFor(() =>
      expect(dashedBox).toHaveStyle(
        `background-color: ${normalizeColor('bg-select', theme)}`,
      ),
    );
    expect(svg).toHaveStyle('fill: #b4cff2');
    expect(text).toHaveStyle('color: #b4cff2');
  });
});

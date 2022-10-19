import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { videoMockFactory } from 'lib-components';
import React, { PropsWithChildren } from 'react';

import { UploadManagerStatus, useUploadManager } from 'lib-components';
import { modelName } from 'lib-components';
import { uploadState } from 'lib-components';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';
import { UploadVideoForm } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('lib-components').UploadManagerStatus,
}));
const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

const mockedOnRetry = jest.fn();
const mockedSetVideoFile = jest.fn();

URL.createObjectURL = () => '/blob/path/to/video';

describe('<UploadVideoForm />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders UploadVideoForm when there is no file selected', () => {
    const mockedVideo = videoMockFactory({ upload_state: uploadState.PENDING });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <UploadVideoForm
          onRetry={mockedOnRetry}
          setVideoFile={mockedSetVideoFile}
        />,
        mockedVideo,
      ),
    );
    screen.getByText('Add a video or drag & drop it');
  });

  it('renders UploadVideoForm with a file selected and then removes the file', async () => {
    const mockedVideo = videoMockFactory({ upload_state: uploadState.PENDING });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {
        [mockedVideo.id]: { status: UploadManagerStatus.SUCCESS } as any,
      },
    });

    const { container } = render(
      wrapInVideo(
        <UploadVideoForm
          onRetry={mockedOnRetry}
          setVideoFile={mockedSetVideoFile}
        />,
        mockedVideo,
      ),
    );

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const hiddenInput = screen.getByTestId('input-video-test-id');
    await act(async () => userEvent.upload(hiddenInput, file));
    expect(mockedSetVideoFile).toHaveBeenNthCalledWith(1, file);

    const video = container.getElementsByTagName('video')[0];
    await waitFor(() => expect(video).toHaveAttribute('controls'));
    expect(video).toHaveAttribute('src', '/blob/path/to/video');

    const removeButton = screen.getByRole('button', {
      name: 'Click on this button to remove the selected video.',
    });
    act(() => userEvent.click(removeButton));
    expect(mockedSetVideoFile).toHaveBeenNthCalledWith(2, null);

    screen.getByText('Add a video or drag & drop it');
  });

  it('renders UploadVideoForm with a file uploading', async () => {
    const mockedVideo = videoMockFactory({ upload_state: uploadState.PENDING });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {
        [mockedVideo.id]: {
          file: new File(['(⌐□_□)'], 'video.mp4', {
            type: 'video/mp4',
          }),
          objectType: modelName.VIDEOS,
          objectId: mockedVideo.id,
          progress: 75,
          status: UploadManagerStatus.UPLOADING,
        },
      },
    });

    render(
      wrapInVideo(
        <UploadVideoForm
          onRetry={mockedOnRetry}
          setVideoFile={mockedSetVideoFile}
        />,
        mockedVideo,
      ),
    );
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const hiddenInput = screen.getByTestId('input-video-test-id');
    await act(async () => userEvent.upload(hiddenInput, file));

    screen.getByText('75 %');
  });

  it('renders UploadVideoForm with a file whom upload has failed and clicks on the retry button', async () => {
    const mockedVideo = videoMockFactory({ upload_state: uploadState.ERROR });

    const mockedResetUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: mockedResetUpload,
      uploadManagerState: {
        [mockedVideo.id]: {
          file: new File(['(⌐□_□)'], 'video.mp4', {
            type: 'video/mp4',
          }),
          objectType: modelName.VIDEOS,
          objectId: mockedVideo.id,
          progress: 0,
          status: UploadManagerStatus.ERR_UPLOAD,
        },
      },
    });

    render(
      wrapInVideo(
        <UploadVideoForm
          onRetry={mockedOnRetry}
          setVideoFile={mockedSetVideoFile}
        />,
        mockedVideo,
      ),
    );
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const hiddenInput = screen.getByTestId('input-video-test-id');
    await act(async () => userEvent.upload(hiddenInput, file));

    screen.getByText(
      'An error occured when uploading your video. Please retry.',
    );

    const retryButton = screen.getByRole('button');
    act(() => userEvent.click(retryButton));
    expect(mockedSetVideoFile).toHaveBeenNthCalledWith(2, null);
    expect(mockedResetUpload).toHaveBeenNthCalledWith(1, mockedVideo.id);
    expect(mockedOnRetry).toHaveBeenCalledTimes(1);

    screen.getByText('Add a video or drag & drop it');
  });
});

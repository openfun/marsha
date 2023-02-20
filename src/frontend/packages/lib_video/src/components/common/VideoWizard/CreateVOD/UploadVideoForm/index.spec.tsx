/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  videoMockFactory,
  UploadManagerStatus,
  useUploadManager,
  modelName,
  uploadState,
} from 'lib-components';
import { render } from 'lib-tests';
import React, { PropsWithChildren } from 'react';

import { wrapInVideo } from 'utils/wrapInVideo';

import { UploadVideoForm } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
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
  afterEach(() => {
    fetchMock.restore();
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

    expect(
      screen.getByText('Add a video or drag & drop it'),
    ).toBeInTheDocument();
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

    userEvent.upload(hiddenInput, file);

    await waitFor(() =>
      expect(mockedSetVideoFile).toHaveBeenNthCalledWith(1, file),
    );

    const video = container.getElementsByTagName('video')[0];
    await waitFor(() => expect(video).toHaveAttribute('controls'));
    expect(video).toHaveAttribute('src', '/blob/path/to/video');

    const removeButton = screen.getByRole('button', {
      name: 'Click on this button to remove the selected video.',
    });

    userEvent.click(removeButton);

    await waitFor(() =>
      expect(mockedSetVideoFile).toHaveBeenNthCalledWith(2, null),
    );

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
          videoId={mockedVideo.id}
          videoUploadState={mockedVideo.upload_state}
        />,
        mockedVideo,
      ),
    );

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const hiddenInput = screen.getByTestId('input-video-test-id');

    userEvent.upload(hiddenInput, file);

    expect(await screen.findByText('75 %')).toBeInTheDocument();
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
          videoId={mockedVideo.id}
          videoUploadState={mockedVideo.upload_state}
        />,
        mockedVideo,
      ),
    );
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const hiddenInput = screen.getByTestId('input-video-test-id');

    userEvent.upload(hiddenInput, file);

    await screen.findByText(
      'An error occured when uploading your video. Please retry.',
    );

    const retryButton = screen.getByRole('button');

    userEvent.click(retryButton);

    expect(mockedSetVideoFile).toHaveBeenNthCalledWith(2, null);
    expect(mockedResetUpload).toHaveBeenNthCalledWith(1, mockedVideo.id);
    expect(mockedOnRetry).toHaveBeenCalledTimes(1);

    screen.getByText('Add a video or drag & drop it');
  });

  it('renders UploadVideoForm with a file too large and clicks on the retry button', async () => {
    const mockedVideo = videoMockFactory({ upload_state: uploadState.ERROR });
    fetchMock.mock('/api/videos/', {
      vod: {
        upload_max_size_bytes: Math.pow(10, 9),
      },
    });

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
          status: UploadManagerStatus.ERR_SIZE,
          message: 'file too large, max size allowed is 1 GB',
        },
      },
    });

    render(
      wrapInVideo(
        <UploadVideoForm
          onRetry={mockedOnRetry}
          setVideoFile={mockedSetVideoFile}
          videoId={mockedVideo.id}
          videoUploadState={mockedVideo.upload_state}
        />,
        mockedVideo,
      ),
    );
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const hiddenInput = screen.getByTestId('input-video-test-id');

    userEvent.upload(hiddenInput, file);

    await screen.findByText(
      'Error : File too large. Max size authorized is 1 GB.',
    );

    const retryButton = screen.getByRole('button');

    userEvent.click(retryButton);

    expect(mockedSetVideoFile).toHaveBeenNthCalledWith(2, null);
    expect(mockedResetUpload).toHaveBeenNthCalledWith(1, mockedVideo.id);
    expect(mockedOnRetry).toHaveBeenCalledTimes(1);

    screen.getByText('Add a video or drag & drop it');
  });
});

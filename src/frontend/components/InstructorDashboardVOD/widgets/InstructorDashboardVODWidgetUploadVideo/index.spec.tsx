import userEvent from '@testing-library/user-event';
import { act, screen } from '@testing-library/react';
import React, { PropsWithChildren } from 'react';

import {
  UploadManagerContext,
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { InstructorDashboardVODWidgetUploadVideo } from '.';

jest.mock('components/UploadManager', () => ({
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('components/UploadManager')
    .UploadManagerStatus,
}));
const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

mockUseUploadManager.mockReturnValue({
  addUpload: jest.fn(),
  resetUpload: jest.fn(),
  uploadManagerState: {},
});

jest.mock('data/appData', () => ({
  appData: {
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
    jwt: 'json web token',
  },
}));

const mockSetInfoWidgetModal = jest.fn();
jest.mock('data/stores/useInfoWidgetModal', () => ({
  useInfoWidgetModal: () => [
    { isVisible: false, text: null, title: null },
    mockSetInfoWidgetModal,
  ],
  InfoWidgetModalProvider: ({ children }: PropsWithChildren<{}>) => children,
}));

describe('<InstructorDashboardVODWidgetUploadVideo />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the component with a video', () => {
    const mockedVideo = videoMockFactory();
    render(
      <InfoWidgetModalProvider value={null}>
        <InstructorDashboardVODWidgetUploadVideo video={mockedVideo} />
      </InfoWidgetModalProvider>,
    );

    screen.getByText('Video');
    act(() => userEvent.click(screen.getByRole('button', { name: 'help' })));
    expect(mockSetInfoWidgetModal).toHaveBeenCalledWith({
      title: 'Video',
      text: 'This widget allows you upload a video to replace the current one.',
    });

    screen.getByText('Video available');
    screen.getByRole('button', { name: 'Replace the video' });
  });

  it('uploads a new video', async () => {
    const mockedVideo = videoMockFactory();

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      <InfoWidgetModalProvider value={null}>
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <InstructorDashboardVODWidgetUploadVideo video={mockedVideo} />
        </UploadManagerContext.Provider>
      </InfoWidgetModalProvider>,
    );
    const uploadButton = screen.getByRole('button', {
      name: 'Replace the video',
    });
    userEvent.click(uploadButton);

    const hiddenInput = screen.getByTestId('input-video-test-id');
    const file = new File(['(⌐□_□)'], 'video.mp4', {
      type: 'video/*',
    });
    userEvent.upload(hiddenInput, file);

    expect(mockAddUpload).toHaveBeenCalledTimes(1);
    expect(mockAddUpload).toHaveBeenLastCalledWith(
      modelName.VIDEOS,
      mockedVideo.id,
      file,
    );
  });

  it('ensures upload state is reset when an upload is successful', async () => {
    const mockedVideo = videoMockFactory({
      upload_state: uploadState.PROCESSING,
    });
    const mockResetUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: mockResetUpload,
      uploadManagerState: {
        [mockedVideo.id]: {
          file: new File(['(⌐□_□)'], 'thumbnail.png', {
            type: 'image/*',
          }),
          objectType: modelName.THUMBNAILS,
          objectId: mockedVideo.id,
          progress: 100,
          status: UploadManagerStatus.SUCCESS,
        },
      },
    });

    const { rerender } = render(
      <InfoWidgetModalProvider value={null}>
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <InstructorDashboardVODWidgetUploadVideo video={mockedVideo} />
        </UploadManagerContext.Provider>
      </InfoWidgetModalProvider>,
    );

    // Simulate an upload which just finished
    rerender(
      <InfoWidgetModalProvider value={null}>
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <InstructorDashboardVODWidgetUploadVideo
            video={{ ...mockedVideo, upload_state: uploadState.READY }}
          />
        </UploadManagerContext.Provider>
      </InfoWidgetModalProvider>,
    );

    expect(mockResetUpload).toBeCalledTimes(1);
    expect(mockResetUpload).toHaveBeenCalledWith(mockedVideo.id);
  });
});

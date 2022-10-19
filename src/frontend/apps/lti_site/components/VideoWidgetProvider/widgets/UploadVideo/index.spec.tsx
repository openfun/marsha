import userEvent from '@testing-library/user-event';
import { act, screen } from '@testing-library/react';
import { useJwt, videoMockFactory } from 'lib-components';
import React, { PropsWithChildren } from 'react';

import {
  UploadManagerContext,
  UploadManagerStatus,
  useUploadManager,
} from 'lib-components';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { modelName } from 'lib-components';
import { uploadState } from 'lib-components';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { UploadVideo } from '.';

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

mockUseUploadManager.mockReturnValue({
  addUpload: jest.fn(),
  resetUpload: jest.fn(),
  uploadManagerState: {},
});

const appData = {
  static: {
    img: {
      liveBackground: 'path/to/image.png',
    },
  },
};

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => appData,
}));

const mockSetInfoWidgetModal = jest.fn();
jest.mock('data/stores/useInfoWidgetModal', () => ({
  useInfoWidgetModal: () => [
    { isVisible: false, text: null, title: null },
    mockSetInfoWidgetModal,
  ],
  InfoWidgetModalProvider: ({ children }: PropsWithChildren<{}>) => children,
}));

describe('<UploadVideo />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the component with a video', () => {
    const mockedVideo = videoMockFactory();
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <UploadVideo />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Video');
    act(() => userEvent.click(screen.getByRole('button', { name: 'help' })));
    expect(mockSetInfoWidgetModal).toHaveBeenCalledWith({
      title: 'Video',
      text: 'This widget allows you to upload a video to replace the current one.',
    });

    screen.getByText('Video available');
    screen.getByRole('button', { name: 'Replace the video' });
  });

  it('uploads a new video', () => {
    const mockedVideo = videoMockFactory();

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <UploadManagerContext.Provider
            value={{
              setUploadState: () => {},
              uploadManagerState: {},
            }}
          >
            <UploadVideo />
          </UploadManagerContext.Provider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
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

  it('ensures upload state is reset when an upload is successful', () => {
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
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <UploadManagerContext.Provider
            value={{
              setUploadState: () => {},
              uploadManagerState: {},
            }}
          >
            <UploadVideo />
          </UploadManagerContext.Provider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    // Simulate an upload which just finished
    rerender(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <UploadManagerContext.Provider
            value={{
              setUploadState: () => {},
              uploadManagerState: {},
            }}
          >
            <UploadVideo />
          </UploadManagerContext.Provider>
        </InfoWidgetModalProvider>,
        { ...mockedVideo, upload_state: uploadState.READY },
      ),
    );

    expect(mockResetUpload).toBeCalledTimes(1);
    expect(mockResetUpload).toHaveBeenCalledWith(mockedVideo.id);
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  InfoWidgetModalProvider,
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  uploadState,
  useJwt,
  useUploadManager,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import { PropsWithChildren } from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { UploadVideo } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('lib-components').UploadManagerStatus,
  useAppConfig: () => appData,
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

describe('<UploadVideo />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the component with a video', async () => {
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

    await userEvent.click(screen.getByRole('button', { name: 'help' }));

    expect(screen.getByText('Video available')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Replace the video' }),
    ).toBeInTheDocument();
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
    await userEvent.click(uploadButton);

    const hiddenInput = screen.getByTestId('input-video-test-id');
    const file = new File(['(⌐□_□)'], 'video.mp4', {
      type: 'video/*',
    });
    await userEvent.upload(hiddenInput, file);

    expect(mockAddUpload).toHaveBeenCalledTimes(1);
    expect(mockAddUpload).toHaveBeenLastCalledWith(
      modelName.VIDEOS,
      mockedVideo.id,
      file,
      undefined,
      expect.any(Function),
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

    expect(mockResetUpload).toHaveBeenCalledTimes(1);
    expect(mockResetUpload).toHaveBeenCalledWith(mockedVideo.id);
  });
});

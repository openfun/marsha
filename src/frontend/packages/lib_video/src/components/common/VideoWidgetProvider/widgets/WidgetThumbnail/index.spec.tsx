import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  uploadState,
  useJwt,
  useThumbnail,
  useUploadManager,
} from 'lib-components';
import { thumbnailMockFactory, videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import { PropsWithChildren } from 'react';

import { createThumbnail } from '@lib-video/api/createThumbnail';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { WidgetThumbnail } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('lib-components').UploadManagerStatus,
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
  }),
  report: jest.fn(),
}));
const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

jest.mock('api/createThumbnail', () => ({
  createThumbnail: jest.fn(),
}));
const mockCreateThumbnail = createThumbnail as jest.MockedFunction<
  typeof createThumbnail
>;

describe('<DashboardLiveWidgetThumbnail />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders the component with default thumbnail', async () => {
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <WidgetThumbnail />
        </InfoWidgetModalProvider>,
        videoMockFactory(),
      ),
    );

    await screen.findByText('Thumbnail');
    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toEqual(null);
    const img = await screen.findByRole('img', {
      name: 'Live video thumbnail',
    });
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    screen.getByRole('button', { name: 'Upload an image' });
  });

  it('uploads a new image', async () => {
    const mockedVideo = videoMockFactory({
      id: '1234',
    });
    const mockedThumbnail = thumbnailMockFactory({
      upload_state: uploadState.PENDING,
      video: mockedVideo.id,
    });

    fetchMock.mock(
      `/api/videos/1234/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    mockCreateThumbnail.mockResolvedValue(mockedThumbnail);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <UploadManagerContext.Provider
            value={{
              setUploadState: () => {},
              uploadManagerState: {},
            }}
          >
            <WidgetThumbnail />
          </UploadManagerContext.Provider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const uploadButton = await screen.findByRole('button', {
      name: 'Upload an image',
    });
    await userEvent.click(uploadButton);

    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'thumbnail.png', {
      type: 'image/*',
    });
    await userEvent.upload(hiddenInput, file);

    await waitFor(() =>
      expect(useThumbnail.getState().thumbnails).toEqual({
        [mockedThumbnail.id]: mockedThumbnail,
      }),
    );
    expect(mockAddUpload).toHaveBeenCalledTimes(1);
    expect(mockAddUpload).toHaveBeenLastCalledWith(
      modelName.THUMBNAILS,
      mockedThumbnail.id,
      file,
      mockedVideo.id,
    );
  });

  it('ensures upload state is reset when an upload is successful', () => {
    const mockedVideo = videoMockFactory({
      id: '4678',
    });
    const mockedThumbnail = thumbnailMockFactory({
      upload_state: uploadState.PENDING,
      video: mockedVideo.id,
    });
    fetchMock.mock(
      `/api/videos/4678/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );
    useThumbnail.getState().addResource(mockedThumbnail);
    const mockResetUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: mockResetUpload,
      uploadManagerState: {
        [mockedThumbnail.id]: {
          file: new File(['(⌐□_□)'], 'thumbnail.png', {
            type: 'image/*',
          }),
          objectType: modelName.THUMBNAILS,
          objectId: mockedThumbnail.id,
          progress: 100,
          status: UploadManagerStatus.SUCCESS,
        },
      },
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
            <WidgetThumbnail />
          </UploadManagerContext.Provider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    // Simulate an upload which just finished
    act(() =>
      useThumbnail
        .getState()
        .addResource({ ...mockedThumbnail, upload_state: uploadState.READY }),
    );

    expect(mockResetUpload).toHaveBeenCalledTimes(1);
    expect(mockResetUpload).toHaveBeenCalledWith(mockedThumbnail.id);
  });

  it('renders the component with an uploaded thumbnail', async () => {
    const mockedVideo = videoMockFactory({
      id: '98874',
    });
    const mockedThumbnail = thumbnailMockFactory({
      is_ready_to_show: true,
      video: mockedVideo.id,
    });
    fetchMock.mock(
      `/api/videos/98874/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );
    useThumbnail.getState().addResource(mockedThumbnail);
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <WidgetThumbnail />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );
    const img = await screen.findByRole('img', {
      name: 'Live video thumbnail',
    });
    expect(img.getAttribute('src')).toEqual(
      'https://example.com/default_thumbnail/144',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/default_thumbnail/144 256w, https://example.com/default_thumbnail/240 426w, https://example.com/default_thumbnail/480 854w, https://example.com/default_thumbnail/720 1280w, https://example.com/default_thumbnail/1080 1920w',
    );
    screen.getByRole('button', { name: 'Delete thumbnail' });
    screen.getByRole('button', { name: 'Upload an image' });
  });

  it('deletes an uploaded thumbnail', async () => {
    const mockedVideo = videoMockFactory({
      id: '4444',
    });
    const mockedThumbnail = thumbnailMockFactory({
      is_ready_to_show: true,
      video: mockedVideo.id,
      id: '6666',
    });
    fetchMock.mock(
      `/api/videos/4444/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );
    useThumbnail.getState().addResource(mockedThumbnail);
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    fetchMock.delete(`/api/videos/4444/thumbnails/6666/`, 204);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <WidgetThumbnail />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );
    const removeButton = await screen.findByRole('button', {
      name: 'Delete thumbnail',
    });

    await userEvent.click(removeButton);

    const confirmButton = screen.getByRole('button', {
      name: 'Delete thumbnail image',
    });

    await userEvent.click(confirmButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(3));
    expect(
      fetchMock.called(`/api/videos/4444/thumbnails/6666/`, {
        headers: {
          Authorization: 'Bearer json web token',
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      }),
    ).toBeTruthy();

    screen.getByText('Thumbnail successfully deleted.');
    expect(useThumbnail.getState().thumbnails).toEqual({});

    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toEqual(null);
    const img = await screen.findByRole('img', {
      name: 'Live video thumbnail',
    });
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toBeNull();
  });

  it('renders the component with default thumbnail in a VOD context', async () => {
    const mockedVideo = videoMockFactory({
      id: '1234',
    });
    fetchMock.mock(
      `/api/videos/1234/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <WidgetThumbnail isLive={false} />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    await screen.findByText('Thumbnail');
    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toEqual(null);
    const img = await screen.findByRole('img', {
      name: 'Live video thumbnail',
    });
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    screen.getByRole('button', { name: 'Upload an image' });
  });

  it('fails to upload an image if the file is too large and displays an error toaster', async () => {
    const mockedVideo = videoMockFactory({
      id: '1234',
    });
    fetchMock.mock(
      `/api/videos/1234/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 6),
      },
      { method: 'OPTIONS' },
    );
    mockCreateThumbnail.mockRejectedValue({
      size: ['File too large !'],
    });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
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
            <WidgetThumbnail />
          </UploadManagerContext.Provider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );
    expect(fetchMock.called(`/api/videos/1234/thumbnails/`)).toBe(true);
    const uploadButton = await screen.findByRole('button', {
      name: 'Upload an image',
    });
    await userEvent.click(uploadButton);

    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'thumbnail.png', {
      type: 'image/*',
    });
    await userEvent.upload(hiddenInput, file);

    expect(screen.queryByText('subs.srt')).not.toBeInTheDocument();
    expect(
      await screen.findByText('Uploaded files exceeds allowed size of 1 MB.'),
    ).toBeInTheDocument();
  });
});

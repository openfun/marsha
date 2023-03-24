import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  UploadManagerContext,
  UploadManagerStatus,
  useUploadManager,
  useJwt,
  thumbnailMockFactory,
  useThumbnail,
  modelName,
  uploadState,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React, { PropsWithChildren } from 'react';

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
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    screen.getByRole('button', { name: 'Upload an image' });
  });

  it('uploads a new image', async () => {
    fetchMock.mock(
      `api/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );
    const mockedThumbnail = thumbnailMockFactory({
      upload_state: uploadState.PENDING,
    });
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
        videoMockFactory(),
      ),
    );

    const uploadButton = await screen.findByRole('button', {
      name: 'Upload an image',
    });
    userEvent.click(uploadButton);

    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'thumbnail.png', {
      type: 'image/*',
    });
    userEvent.upload(hiddenInput, file);

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
    );
  });

  it('ensures upload state is reset when an upload is successful', () => {
    fetchMock.mock(
      `api/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );
    const mockedThumbnail = thumbnailMockFactory({
      upload_state: uploadState.PENDING,
    });
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
        videoMockFactory(),
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
    fetchMock.mock(
      `api/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );
    const mockedThumbnail = thumbnailMockFactory({ is_ready_to_show: true });
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
        videoMockFactory(),
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
    fetchMock.mock(
      `api/thumbnails/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );
    const mockedThumbnail = thumbnailMockFactory({ is_ready_to_show: true });
    useThumbnail.getState().addResource(mockedThumbnail);
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    fetchMock.delete(`/api/thumbnails/${mockedThumbnail.id}/`, 204);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <WidgetThumbnail />
        </InfoWidgetModalProvider>,
        videoMockFactory(),
      ),
    );
    const removeButton = await screen.findByRole('button', {
      name: 'Delete thumbnail',
    });

    userEvent.click(removeButton);

    const confirmButton = screen.getByRole('button', {
      name: 'Confirm',
    });

    userEvent.click(confirmButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/thumbnails/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Accept-Language': 'en',
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'OPTIONS',
    });

    screen.getByText('Thumbnail successfully deleted.');
    expect(useThumbnail.getState().thumbnails).toEqual({});

    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toEqual(null);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toBeNull();
  });

  it('renders the component with default thumbnail in a VOD context', async () => {
    fetchMock.mock(
      `api/thumbnails/`,
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
        videoMockFactory(),
      ),
    );

    await screen.findByText('Thumbnail');
    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toEqual(null);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    screen.getByRole('button', { name: 'Upload an image' });
  });

  it('fails to upload an image if the file is too large and displays an error toaster', async () => {
    fetchMock.mock(
      `api/thumbnails/`,
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
        videoMockFactory(),
      ),
    );
    expect(fetchMock.called('api/thumbnails/')).toBe(true);
    const uploadButton = await screen.findByRole('button', {
      name: 'Upload an image',
    });
    userEvent.click(uploadButton);

    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'thumbnail.png', {
      type: 'image/*',
    });
    userEvent.upload(hiddenInput, file);

    expect(screen.queryByText('subs.srt')).not.toBeInTheDocument();
    expect(
      await screen.findByText('Uploaded files exceeds allowed size of 1 MB.'),
    ).toBeInTheDocument();
  });
});

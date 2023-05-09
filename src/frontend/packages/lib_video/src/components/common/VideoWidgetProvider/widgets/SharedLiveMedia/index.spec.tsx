import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useJwt,
  sharedLiveMediaMockFactory,
  videoMockFactory,
  UploadManagerContext,
  useUploadManager,
  useSharedLiveMedia,
  modelName,
  uploadState,
  report,
} from 'lib-components';
import { render } from 'lib-tests';
import React, { PropsWithChildren } from 'react';

import { DeleteSharedLiveMediaModalProvider } from '@lib-video/hooks/useDeleteSharedLiveMediaModal';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { SharedLiveMediaModalWrapper } from '../../wrappers/SharedLiveMediaModalWrapper';

import { SharedLiveMedia } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  report: jest.fn(),
}));

const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

describe('<SharedLiveMedia />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the widget without any uploaded medias', () => {
    const mockedVideo = videoMockFactory();
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <InfoWidgetModalProvider value={null}>
            <DeleteSharedLiveMediaModalProvider value={null}>
              <SharedLiveMediaModalWrapper />
              <SharedLiveMedia isLive isTeacher />
            </DeleteSharedLiveMediaModalProvider>
          </InfoWidgetModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('Supports sharing')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Upload a presentation support',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('You have no uploaded documents yet.'),
    ).toBeInTheDocument();
  });

  it('uploads a file', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
    });

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    fetchMock.post(
      `/api/videos/${videoId}/sharedlivemedias/`,
      mockedSharedLiveMedia,
    );

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <InfoWidgetModalProvider value={null}>
            <DeleteSharedLiveMediaModalProvider value={null}>
              <SharedLiveMediaModalWrapper />
              <SharedLiveMedia isLive isTeacher />
            </DeleteSharedLiveMediaModalProvider>
          </InfoWidgetModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    const uploadButton = screen.getByRole('button', {
      name: 'Upload a presentation support',
    });
    userEvent.click(uploadButton);

    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'sharedLiveMedia.pdf', {
      type: 'application/pdf',
    });
    userEvent.upload(hiddenInput, file);
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${videoId}/sharedlivemedias/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    await waitFor(() => expect(mockAddUpload).toHaveBeenCalledTimes(1));
    expect(mockAddUpload).toHaveBeenLastCalledWith(
      modelName.SHAREDLIVEMEDIAS,
      mockedSharedLiveMedia.id,
      file,
    );
  });

  it('successfully deletes a shared live media', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    fetchMock.delete(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
      204,
    );

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <InfoWidgetModalProvider value={null}>
            <DeleteSharedLiveMediaModalProvider value={null}>
              <SharedLiveMediaModalWrapper />
              <SharedLiveMedia isLive isTeacher />
            </DeleteSharedLiveMediaModalProvider>
          </InfoWidgetModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    expect(useSharedLiveMedia.getState().getSharedLiveMedias()).toEqual([
      mockedSharedLiveMedia,
    ]);
    expect(
      screen.queryByText('You have no uploaded documents yet.'),
    ).toBeNull();
    screen.getByRole('button', {
      name: 'Click on this button to stop allowing students to download this media.',
    });
    screen.getByRole('button', { name: 'Share' });
    screen.getByRole('link', { name: 'Title of the file' });

    const deleteButton = screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });
    userEvent.click(deleteButton);
    const confirmDeleteButton = screen.getByRole('button', { name: 'Confirm' });

    userEvent.click(confirmDeleteButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
    expect(report).not.toHaveBeenCalled();
    expect(useSharedLiveMedia.getState().getSharedLiveMedias()).toHaveLength(0);
    screen.getByText('Shared media deleted.');
  });

  it('fails to delete a shared live media', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    fetchMock.delete(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
      500,
    );

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <InfoWidgetModalProvider value={null}>
            <DeleteSharedLiveMediaModalProvider value={null}>
              <SharedLiveMediaModalWrapper />
              <SharedLiveMedia isLive isTeacher />
            </DeleteSharedLiveMediaModalProvider>
          </InfoWidgetModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    expect(useSharedLiveMedia.getState().getSharedLiveMedias()).toEqual([
      mockedSharedLiveMedia,
    ]);
    expect(
      screen.queryByText('You have no uploaded documents yet.'),
    ).toBeNull();
    screen.getByRole('button', {
      name: 'Click on this button to stop allowing students to download this media.',
    });
    screen.getByRole('button', { name: 'Share' });
    screen.getByRole('link', { name: 'Title of the file' });

    const deleteButton = screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });

    userEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', { name: 'Confirm' });

    userEvent.click(confirmDeleteButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });

    expect(report).toHaveBeenCalled();
    expect(useSharedLiveMedia.getState().getSharedLiveMedias()).toEqual([
      mockedSharedLiveMedia,
    ]);
    screen.getByText('Shared media deletion has failed !');
  });

  it('retry to upload a failed upload', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      active_stamp: null,
      filename: null,
      is_ready_to_show: false,
      nb_pages: null,
      show_download: true,
      title: null,
      upload_state: uploadState.PENDING,
      urls: null,
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });
    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <InfoWidgetModalProvider value={null}>
            <DeleteSharedLiveMediaModalProvider value={null}>
              <SharedLiveMediaModalWrapper />
              <SharedLiveMedia isLive isTeacher />
            </DeleteSharedLiveMediaModalProvider>
          </InfoWidgetModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    expect(
      screen.queryByText('You have no uploaded documents yet.'),
    ).toBeNull();
    screen.getByRole('button', {
      name: 'Click on this button to stop allowing students to download this media.',
    });
    screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });
    screen.getByText('Upload has failed');
    const retryButton = screen.getByRole('button', {
      name: 'Click on this button to retry uploading your failed upload.',
    });

    userEvent.click(retryButton);
    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'SharedLiveMedia.pdf', {
      type: 'application/pdf',
    });
    userEvent.upload(hiddenInput, file);
    expect(fetchMock.calls()).toHaveLength(0);

    await waitFor(() => expect(mockAddUpload).toHaveBeenCalledTimes(1));
    expect(mockAddUpload).toHaveBeenLastCalledWith(
      modelName.SHAREDLIVEMEDIAS,
      mockedSharedLiveMedia.id,
      file,
    );
  });

  it('renders the component in teacher VOD mode', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaModalWrapper />
            <SharedLiveMedia isLive={false} isTeacher />
          </DeleteSharedLiveMediaModalProvider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByRole('button', { name: 'Upload a presentation support' });
    screen.getByRole('button', {
      name: 'Click on this button to stop allowing students to download this media.',
    });
    screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });

    expect(
      screen.queryByRole('button', { name: 'Share' }),
    ).not.toBeInTheDocument();
  });

  it('renders the component in student VOD mode', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaModalWrapper />
            <SharedLiveMedia isLive={false} isTeacher={false} />
          </DeleteSharedLiveMediaModalProvider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Upload a presentation support' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to stop allowing students to download this media.',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Share' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Download all available supports' });
    screen.getByRole('link', { name: 'Title of the file' });
  });

  it('does not show the media if show_donwload is set to false', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: videoId,
      show_download: true,
    });
    const secondMockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file 2',
      video: videoId,
      show_download: false,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia, secondMockedSharedLiveMedia],
    });
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaModalWrapper />
            <SharedLiveMedia isLive={false} isTeacher={false} />
          </DeleteSharedLiveMediaModalProvider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );
    expect(
      screen.queryByRole('link', { name: 'Title of the file 2' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Download all available supports' });
    screen.getByRole('link', { name: 'Title of the file' });
  });

  it('does not show anything in public is there is no media to downoad', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: videoId,
      show_download: false,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaModalWrapper />
            <SharedLiveMedia isLive={false} isTeacher={false} />
          </DeleteSharedLiveMediaModalProvider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );
    expect(
      screen.queryByRole('link', { name: 'Title of the file' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Download all available supports' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Supports sharing')).not.toBeInTheDocument();
  });

  it('shows the compoment in teacher view even if is there is no media to downoad', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: videoId,
      show_download: false,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaModalWrapper />
            <SharedLiveMedia isLive={false} isTeacher />
          </DeleteSharedLiveMediaModalProvider>
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(
      screen.getByRole('link', { name: 'Title of the file' }),
    ).toBeInTheDocument();
  });
});

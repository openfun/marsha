import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import React, { PropsWithChildren } from 'react';

import { SharedLiveMediaModalWrapper } from 'components/DashboardLive/DashboardLiveControlPane/components/SharedLiveMediaModalWrapper';
import {
  UploadManagerContext,
  useUploadManager,
} from 'components/UploadManager';
import { useJwt } from 'data/stores/useJwt';
import { DeleteSharedLiveMediaModalProvider } from 'data/stores/useDeleteSharedLiveMediaModal';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { useSharedLiveMedia } from 'data/stores/useSharedLiveMedia';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import { report } from 'utils/errors/report';
import {
  sharedLiveMediaMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { DashboardLiveWidgetSharedLiveMedia } from '.';

jest.mock('components/UploadManager', () => ({
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
}));

const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('<DashboardLiveWidgetSharedLiveMedia />', () => {
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
              <DashboardLiveWidgetSharedLiveMedia />
            </DeleteSharedLiveMediaModalProvider>
          </InfoWidgetModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    screen.getByText('Supports sharing');
    screen.getByRole('button', {
      name: 'Upload a presentation support',
    });
    screen.getByText('You have no uploaded documents yet.');
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

    fetchMock.post('/api/sharedlivemedias/', mockedSharedLiveMedia);

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
              <DashboardLiveWidgetSharedLiveMedia />
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
    expect(fetchMock.lastCall()![0]).toEqual(`/api/sharedlivemedias/`);
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

    fetchMock.delete(`/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`, 204);

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
              <DashboardLiveWidgetSharedLiveMedia />
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
    act(() => userEvent.click(confirmDeleteButton));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
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

    fetchMock.delete(`/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`, 500);

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
              <DashboardLiveWidgetSharedLiveMedia />
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
    await act(async () => userEvent.click(deleteButton));
    const confirmDeleteButton = screen.getByRole('button', { name: 'Confirm' });
    act(() => userEvent.click(confirmDeleteButton));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
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
              <DashboardLiveWidgetSharedLiveMedia />
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
    const file = new File(['(⌐□_□)'], 'sharedMedia.pdf', {
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
});

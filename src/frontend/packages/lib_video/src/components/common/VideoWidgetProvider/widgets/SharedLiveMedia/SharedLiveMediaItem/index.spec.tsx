import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import {
  useJwt,
  videoMockFactory,
  sharedLiveMediaMockFactory,
  UploadingObject,
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  uploadState,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { DeleteSharedLiveMediaModalProvider } from '@lib-video/hooks/useDeleteSharedLiveMediaModal';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { SharedLiveMediaItem } from '.';

const mockedOnRetryFailedUpload = jest.fn();

describe('<SharedLiveMediaItem />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders a SharedLiveMediaItem which is uploading', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      active_stamp: null,
      filename: null,
      is_ready_to_show: false,
      nb_pages: null,
      title: null,
      upload_state: uploadState.PENDING,
      urls: null,
      video: videoId,
    });
    const mockedUploadingObject: UploadingObject = {
      file: new File([], 'uploadingObjectFileName.pdf'),
      objectType: modelName.SHAREDLIVEMEDIAS,
      objectId: mockedSharedLiveMedia.id,
      progress: 50,
      status: UploadManagerStatus.UPLOADING,
    };
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {
              [mockedSharedLiveMedia.id]: mockedUploadingObject,
            },
          }}
        >
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaItem
              isShared={null}
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              sharedLiveMedia={mockedSharedLiveMedia}
              uploadingObject={mockedUploadingObject}
              isLive
              isTeacher
            />
          </DeleteSharedLiveMediaModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    expect(
      screen.getByRole('button', {
        name: 'Click on this button to stop allowing students to download this media.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Click on this button to delete the media.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('uploadingObjectFileName.pdf')).toBeInTheDocument();
    expect(screen.getByText('Uploading')).toBeInTheDocument();
  });

  it('renders a SharedLiveMediaItem which is processing (with upload object)', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      active_stamp: null,
      filename: null,
      is_ready_to_show: false,
      nb_pages: null,
      title: 'sharedLiveMediaFileName.pdf',
      upload_state: uploadState.PENDING,
      urls: null,
      video: videoId,
    });
    const mockedUploadingObject: UploadingObject = {
      file: new File([], 'uploadingObjectFileName.pdf'),
      objectType: modelName.SHAREDLIVEMEDIAS,
      objectId: mockedSharedLiveMedia.id,
      progress: 100,
      status: UploadManagerStatus.SUCCESS,
    };
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {
              [mockedSharedLiveMedia.id]: mockedUploadingObject,
            },
          }}
        >
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaItem
              isShared={null}
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              sharedLiveMedia={mockedSharedLiveMedia}
              uploadingObject={mockedUploadingObject}
              isLive
              isTeacher
            />
          </DeleteSharedLiveMediaModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    expect(
      screen.getByRole('button', {
        name: 'Click on this button to stop allowing students to download this media.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Click on this button to delete the media.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('sharedLiveMediaFileName.pdf')).toBeInTheDocument();
    screen.getByText('Processing');
  });

  it('renders a SharedLiveMediaItem which is processing (without upload object)', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      active_stamp: null,
      filename: null,
      is_ready_to_show: false,
      nb_pages: null,
      title: 'sharedLiveMediaFileName.pdf',
      upload_state: uploadState.PROCESSING,
      urls: null,
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaItem
              isShared={null}
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              sharedLiveMedia={mockedSharedLiveMedia}
              isLive
              isTeacher
            />
          </DeleteSharedLiveMediaModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    expect(
      screen.getByRole('button', {
        name: 'Click on this button to stop allowing students to download this media.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Click on this button to delete the media.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('sharedLiveMediaFileName.pdf')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('renders a SharedLiveMediaItem which is ready (and with students download disallowed)', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      show_download: false,
      title: 'sharedLiveMediaFileName.pdf',
      upload_state: uploadState.READY,
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaItem
              isShared={null}
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              sharedLiveMedia={mockedSharedLiveMedia}
              isLive
              isTeacher
            />
          </DeleteSharedLiveMediaModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    expect(
      screen.getByRole('button', {
        name: 'Click on this button to allow students to download the media.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Click on this button to delete the media.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('sharedLiveMediaFileName.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  it('renders a SharedLiveMediaItem which is ready (and being shared with students but not downloadable)', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'sharedLiveMediaFileName.pdf',
      show_download: false,
      upload_state: uploadState.READY,
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
      active_shared_live_media: mockedSharedLiveMedia,
      active_shared_live_media_page: 1,
    });

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaItem
              isShared={true}
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              sharedLiveMedia={mockedSharedLiveMedia}
              isLive
              isTeacher
            />
          </DeleteSharedLiveMediaModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    expect(
      screen.getByRole('button', {
        name: 'Click on this button to allow students to download the media.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Click on this button to delete the media.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('sharedLiveMediaFileName.pdf')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Stop sharing' }),
    ).toBeInTheDocument();
  });

  it('renders a SharedLiveMediaItem which has an error', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: null,
      upload_state: uploadState.ERROR,
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaItem
              isShared={null}
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              sharedLiveMedia={mockedSharedLiveMedia}
              isLive
              isTeacher
            />
          </DeleteSharedLiveMediaModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    screen.getByRole('button', {
      name: 'Click on this button to stop allowing students to download this media.',
    });
    screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });
    screen.getByText('Upload has failed');
    screen.getByText('Retry');
    const retryButton = screen.getByRole('button', {
      name: 'Click on this button to retry uploading your failed upload.',
    });
    userEvent.click(retryButton);
    expect(mockedOnRetryFailedUpload).toHaveBeenCalledTimes(1);
    expect(mockedOnRetryFailedUpload).toHaveBeenCalledWith(
      mockedSharedLiveMedia.id,
    );
  });

  it('renders a SharedLiveMediaItem which has failed', () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: null,
      upload_state: uploadState.PENDING,
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <DeleteSharedLiveMediaModalProvider value={null}>
            <SharedLiveMediaItem
              isShared={null}
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              sharedLiveMedia={mockedSharedLiveMedia}
              isLive
              isTeacher
            />
          </DeleteSharedLiveMediaModalProvider>
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
    );

    screen.getByRole('button', {
      name: 'Click on this button to stop allowing students to download this media.',
    });
    screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });
    screen.getByText('Upload has failed');
    screen.getByText('Retry');
    const retryButton = screen.getByRole('button', {
      name: 'Click on this button to retry uploading your failed upload.',
    });
    userEvent.click(retryButton);
    expect(mockedOnRetryFailedUpload).toHaveBeenCalledTimes(1);
    expect(mockedOnRetryFailedUpload).toHaveBeenCalledWith(
      mockedSharedLiveMedia.id,
    );
  });
});

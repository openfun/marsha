/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';
import React from 'react';

import { FULL_SCREEN_ERROR_ROUTE } from 'common/ErrorComponents/route';
import { UploadManager } from 'common/UploadManager';
import { DASHBOARD_ROUTE } from 'data/routes';
import { uploadFile } from 'data/sideEffects/uploadFile';
import { getStoreResource } from 'data/stores/generics';
import { modelName } from 'types/models';
import { timedTextMode, uploadState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';

import { UploadForm } from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({ modelName: 'videos' }),
}));

jest.mock('data/stores/generics', () => ({
  getStoreResource: jest.fn(),
}));

jest.mock('data/sideEffects/uploadFile', () => ({
  uploadFile: jest.fn(),
}));

const mockUploadFile: jest.MockedFunction<typeof uploadFile> =
  uploadFile as any;
const mockGetResource = getStoreResource as jest.MockedFunction<
  typeof getStoreResource
>;

describe('UploadForm', () => {
  const object = videoMockFactory({
    id: 'video-id',
    timed_text_tracks: [
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        source_url: 'https://example.com/timedtext/ttt-1',
        url: 'https://example.com/timedtext/ttt-1.vtt',
        title: 'ttt1',
        video: 'video-id',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_show: false,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        source_url: 'https://example.com/timedtext/ttt-2',
        url: 'https://example.com/timedtext/ttt-2.vtt',
        title: 'ttt2',
        video: 'video-id',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_show: true,
        language: 'en',
        mode: timedTextMode.CLOSED_CAPTIONING,
        upload_state: uploadState.READY,
        source_url: 'https://example.com/timedtext/ttt-3',
        url: 'https://example.com/timedtext/ttt-3.vtt',
        title: 'ttt3',
        video: 'video-id',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.TRANSCRIPT,
        upload_state: uploadState.READY,
        source_url: 'https://example.com/timedtext/ttt-4',
        url: 'https://example.com/timedtext/ttt-4.vtt',
        title: 'ttt4',
        video: 'video-id',
      },
    ],
    title: 'Some title',
    upload_state: uploadState.PENDING,
    urls: {
      manifests: {
        hls: 'https://example.com/hls.m3u8',
      },
      mp4: {
        144: 'https://example.com/144p.mp4',
        1080: 'https://example.com/1080p.mp4',
      },
      thumbnails: {
        720: 'https://example.com/144p.jpg',
      },
    },
  });

  beforeEach(jest.resetAllMocks);

  afterEach(() => fetchMock.restore());

  it('renders the form by default', async () => {
    mockGetResource.mockResolvedValue(object);
    render(<UploadForm objectId={object.id} objectType={modelName.VIDEOS} />);

    expect(await screen.findByText('Create a new video')).toBeInTheDocument();
  });

  it('gets the policy from the API and uses it to upload the file', async () => {
    const mockInitiateUpload = fetchMock.mock(
      `/api/videos/${object.id}/initiate-upload/`,
      {
        fields: {
          key: 'foo',
        },
        url: 'https://s3.aws.example.com/',
      },
      {
        method: 'POST',
      },
    );

    fetchMock.mock(`/api/videos/${object.id}/`, 200, { method: 'PUT' });

    mockGetResource.mockResolvedValue(object);
    mockUploadFile.mockResolvedValue(true);

    const { container } = render(
      <UploadManager>
        <UploadForm objectId={object.id} objectType={modelName.VIDEOS} />
      </UploadManager>,
      {
        routerOptions: {
          routes: [
            {
              path: DASHBOARD_ROUTE(),
              render: () => <span>dashboard</span>,
            },
          ],
        },
      },
    );

    // First the form goes through a loading state as we get the object
    screen.getByRole('status', { name: 'Preparing for upload...' });

    // The form is rendered as we receive the uploadable
    await screen.findByRole('heading', { name: 'Create a new video' });
    screen.getByRole('button', { name: 'Select a file to upload' });

    fireEvent.drop(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' })],
      },
    });

    await waitFor(() => expect(mockInitiateUpload.calls()).toHaveLength(1));
    expect(mockUploadFile).toHaveBeenCalled();
    screen.getByText('dashboard');
  });

  it('redirects to /errors/policy when it fails to trigger initiate-upload', async () => {
    const mockInitiateUpload = fetchMock.mock(
      `/api/videos/${object.id}/initiate-upload/`,
      400,
    );
    mockGetResource.mockResolvedValue(object);

    const { container } = render(
      <UploadManager>
        <UploadForm objectId={object.id} objectType={modelName.VIDEOS} />
      </UploadManager>,
      {
        routerOptions: {
          routes: [
            {
              path: FULL_SCREEN_ERROR_ROUTE('policy'),
              render: () => <span>error policy</span>,
            },
          ],
        },
      },
    );
    await screen.findByText('Create a new video');

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' })],
      },
    });
    await waitFor(() => expect(mockInitiateUpload.calls()).toHaveLength(1));
    expect(mockUploadFile).not.toHaveBeenCalled();
    screen.getByText('error policy');
  });

  it('redirects to /errors/upload when it fails to perform the actual upload', async () => {
    const mockInitiateUpload = fetchMock.mock(
      `/api/videos/${object.id}/initiate-upload/`,
      {
        fields: {
          key: 'foo',
        },
        url: 'https://s3.aws.example.com/',
      },
      {
        method: 'POST',
      },
    );

    mockGetResource.mockResolvedValue(object);
    mockUploadFile.mockRejectedValue(new Error('failed to upload file'));

    const { container } = render(
      <UploadManager>
        <UploadForm objectId={object.id} objectType={modelName.VIDEOS} />
      </UploadManager>,
      {
        routerOptions: {
          routes: [
            {
              path: FULL_SCREEN_ERROR_ROUTE('upload'),
              render: () => <span>error upload</span>,
            },
          ],
        },
      },
    );
    await screen.findByText('Create a new video');

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' })],
      },
    });
    await waitFor(() => expect(mockInitiateUpload.calls()).toHaveLength(1));
    expect(mockUploadFile).toHaveBeenCalled();
    screen.getByText('error upload');
  });
});

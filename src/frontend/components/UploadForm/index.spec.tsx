import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { useParams } from 'react-router-dom';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { UploadManager } from 'components/UploadManager';
import { uploadFile } from 'data/sideEffects/uploadFile';
import { getResource } from 'data/stores/generics';
import { modelName } from 'types/models';
import { timedTextMode, uploadState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import { UploadForm } from './index';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

jest.mock('jwt-decode', () => jest.fn());

jest.mock('data/appData', () => ({
  appData: {
    modelName: 'videos',
  },
}));
jest.mock('data/sideEffects/uploadFile', () => ({
  uploadFile: jest.fn(),
}));
jest.mock('data/stores/generics', () => ({
  getResource: jest.fn(),
}));

const mockUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>;
const mockGetResource = getResource as jest.MockedFunction<typeof getResource>;

describe('UploadForm', () => {
  const object = videoMockFactory({
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
    mockUseParams.mockReturnValue({
      objectId: object.id,
      objectType: modelName.VIDEOS,
    });
    render(wrapInIntlProvider(wrapInRouter(<UploadForm />)));

    await screen.findByText('Create a new video');
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
    mockUseParams.mockReturnValue({
      objectId: object.id,
      objectType: modelName.VIDEOS,
    });
    const { container } = render(
      <UploadManager>
        {wrapInIntlProvider(
          wrapInRouter(<UploadForm />, [
            {
              path: DASHBOARD_ROUTE(modelName.VIDEOS),
              element: <span>dashboard</span>,
            },
          ]),
        )}
      </UploadManager>,
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
    mockUseParams.mockReturnValue({
      objectId: object.id,
      objectType: modelName.VIDEOS,
    });
    const { container } = render(
      <UploadManager>
        {wrapInIntlProvider(
          wrapInRouter(<UploadForm />, [
            {
              path: FULL_SCREEN_ERROR_ROUTE('policy'),
              element: <span>error policy</span>,
            },
          ]),
        )}
      </UploadManager>,
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
});

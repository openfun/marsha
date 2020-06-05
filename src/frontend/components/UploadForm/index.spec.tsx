import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

jest.mock('../../data/sideEffects/uploadFile', () => ({
  uploadFile: jest.fn(),
}));

import { uploadFile } from '../../data/sideEffects/uploadFile';
import { getResource } from '../../data/stores/generics';
import { modelName } from '../../types/models';
import { timedTextMode, uploadState, Video } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { jestMockOf } from '../../utils/types';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UploadForm } from './index';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('../../data/stores/generics', () => ({
  addResource: jest.fn(),
  getResource: jest.fn(),
}));

jest.mock('../../data/appData', () => ({
  appData: {
    modelName: 'videos',
  },
}));

const mockUploadFile: jestMockOf<typeof uploadFile> = uploadFile as any;
const mockGetResource = getResource as jestMockOf<typeof getResource>;

describe('UploadForm', () => {
  const object = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_show: true,
    show_download: false,
    thumbnail: null,
    timed_text_tracks: [
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_show: false,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_show: true,
        language: 'en',
        mode: timedTextMode.CLOSED_CAPTIONING,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-3.vtt',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.TRANSCRIPT,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-4.vtt',
      },
    ],
    title: 'Some title',
    upload_state: 'pending',
    urls: {
      manifests: {
        dash: 'https://example.com/dash.mpd',
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
  } as Video;

  beforeEach(jest.resetAllMocks);

  afterEach(() => fetchMock.restore());

  it('renders the form by default', async () => {
    mockGetResource.mockResolvedValue(object);
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <UploadForm objectId={object.id} objectType={modelName.VIDEOS} />,
        ),
      ),
    );

    await screen.findByText('Create a new video');
  });

  it('gets the policy from the API and uses it to upload the file', async () => {
    fetchMock.mock(
      '/api/videos/video-id/initiate-upload/',
      {
        fields: {
          key: 'foo',
        },
        url: 'https://s3.aws.example.com/',
      },
      { method: 'POST' },
    );
    fetchMock.mock('/api/videos/video-id/', 200, { method: 'PUT' });
    mockUploadFile.mockResolvedValue(true);
    mockGetResource.mockResolvedValue(object);

    const { container } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <UploadForm objectId={object.id} objectType={modelName.VIDEOS} />,
          [
            {
              path: DASHBOARD_ROUTE(),
              render: () => <span>dashboard</span>,
            },
          ],
        ),
      ),
    );
    await screen.findByText('Create a new video');

    fireEvent.drop(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' })],
      },
    });
    await waitFor(() =>
      expect(
        fetchMock.called('/api/videos/video-id/initiate-upload/', {
          method: 'POST',
        }),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(fetchMock.called('/api/videos/video-id/', { method: 'PUT' })).toBe(
        true,
      ),
    );
    expect(mockUploadFile).toHaveBeenCalled();
    // redirected to the dashboard
    screen.getByText('dashboard');
  });

  it('redirects to /errors/policy when it fails to trigger initiate-upload', async () => {
    fetchMock.mock('/api/videos/video-id/initiate-upload/', 400, {
      method: 'POST',
    });
    mockGetResource.mockResolvedValue(object);

    const { container } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <UploadForm objectId={object.id} objectType={modelName.VIDEOS} />,
          [
            {
              path: ERROR_COMPONENT_ROUTE('policy'),
              render: () => <span>error policy</span>,
            },
          ],
        ),
      ),
    );
    await screen.findByText('Create a new video');

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' })],
      },
    });
    await waitFor(() =>
      expect(
        fetchMock.calls('/api/videos/video-id/initiate-upload/', {
          method: 'POST',
        }),
      ).toHaveLength(1),
    );
    await waitFor(() => {});
    expect(mockUploadFile).not.toHaveBeenCalled();
    // redirected to the dashboard
    screen.getByText('error policy');
  });
});

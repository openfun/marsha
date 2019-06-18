import { cleanup, fireEvent, render, wait } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { Provider } from 'react-redux';

jest.mock('../../data/sideEffects/uploadFile/uploadFile', () => ({
  uploadFile: jest.fn(),
}));

import { bootstrapStore } from '../../data/bootstrapStore';
import { uploadFile } from '../../data/sideEffects/uploadFile/uploadFile';
import { modelName } from '../../types/models';
import { timedTextMode, uploadState, Video } from '../../types/tracks';
import { wrapInRouter } from '../../utils/tests/router';
import { jestMockOf } from '../../utils/types';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UploadForm } from './index';

jest.mock('jwt-decode', () => jest.fn());

const mockUploadFile: jestMockOf<typeof uploadFile> = uploadFile as any;

describe('UploadForm', () => {
  const object = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_play: true,
    show_download: false,
    thumbnail: null,
    timed_text_tracks: [
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_play: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_play: false,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_play: true,
        language: 'en',
        mode: timedTextMode.CLOSED_CAPTIONING,
        upload_state: uploadState.READY,
        url: 'https://example.com/timedtext/ttt-3.vtt',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_play: true,
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

  const state = {
    jwt: {
      read_only: false,
    },
    video: object,
  } as any;

  beforeEach(jest.resetAllMocks);
  // Disable useless async act warnings
  // TODO: remove this spy as soon as async act is available
  beforeAll(() => {
    jest.spyOn(console, 'error');
  });

  afterEach(cleanup);
  afterEach(fetchMock.restore);

  it('renders the form by default', () => {
    const { getByText } = render(
      wrapInRouter(
        <Provider store={bootstrapStore(state)}>
          <UploadForm objectId={object.id} objectType={modelName.VIDEOS} />
        </Provider>,
      ),
    );

    getByText('Create a new video');
  });

  it('gets the policy from the API and uses it to upload the file', async () => {
    fetchMock.mock(
      '/api/videos/video-id/initiate-upload/',
      {
        bucket: 'dev',
        s3_endpoint: 's3.aws.example.com',
      },
      { method: 'POST' },
    );
    mockUploadFile.mockResolvedValue(true);

    const { container, getByText } = render(
      wrapInRouter(
        <Provider store={bootstrapStore(state)}>
          <UploadForm objectId={object.id} objectType={modelName.VIDEOS} />
        </Provider>,
        [
          {
            path: DASHBOARD_ROUTE(),
            render: () => <span>dashboard</span>,
          },
        ],
      ),
    );

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' })],
      },
    });
    await wait();
    expect(
      fetchMock.calls('/api/videos/video-id/initiate-upload/', {
        method: 'POST',
      }),
    ).toHaveLength(1);
    await wait();
    expect(mockUploadFile).toHaveBeenCalled();
    // redirected to the dashboard
    getByText('dashboard');
  });

  it('redirects to /errors/policy when it fails to trigger initiate-upload', async () => {
    fetchMock.mock('/api/videos/video-id/initiate-upload/', 400, {
      method: 'POST',
    });

    const { container, getByText } = render(
      wrapInRouter(
        <Provider store={bootstrapStore(state)}>
          <UploadForm objectId={object.id} objectType={modelName.VIDEOS} />
        </Provider>,
        [
          {
            path: ERROR_COMPONENT_ROUTE('policy'),
            render: () => <span>error policy</span>,
          },
        ],
      ),
    );

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' })],
      },
    });
    await wait();
    expect(
      fetchMock.calls('/api/videos/video-id/initiate-upload/', {
        method: 'POST',
      }),
    ).toHaveLength(1);
    await wait();
    expect(mockUploadFile).not.toHaveBeenCalled();
    // redirected to the dashboard
    getByText('error policy');
  });
});

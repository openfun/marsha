import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route } from 'react-router';

import { createPlayer } from '../../Player/createPlayer';
import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';
import { Deferred } from '../../utils/tests/Deferred';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { UploadManagerContext, UploadManagerStatus } from '../UploadManager';
import { VideoView } from '.';

jest.mock('../../Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));

jest.mock('../../data/appData', () => ({
  appData: {},
}));

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

describe('<VideoView />', () => {
  afterEach(() => fetchMock.restore());

  it('shows an error message when it fails to get the video', async () => {
    const video = videoMockFactory();

    const getVideoDeferred = new Deferred();
    fetchMock.get(`/api/videos/${video.id}/`, getVideoDeferred.promise);

    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/${video.id}`]}>
            <Route path="/:videoId">
              <VideoView />
            </Route>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('heading', { name: 'Video' });
    screen.getByRole('status', { name: 'Loading video...' });

    await act(async () => getVideoDeferred.resolve(500));

    screen.getByRole('heading', { name: 'There was an unexpected error' });
    screen.getByText(
      'We could not access the appropriate resources. You can try reloading the page or come back again at a later time.',
    );
  });

  it('gets the video and its timed text tracks and shows a player if the video is ready', async () => {
    const video = videoMockFactory();

    const getVideoDeferred = new Deferred();
    fetchMock.get(`/api/videos/${video.id}/`, getVideoDeferred.promise);

    const getTimedTextTracksDeferred = new Deferred();
    fetchMock.get(
      `/api/timedtexttracks/?video=${video.id}&limit=999`,
      getTimedTextTracksDeferred.promise,
    );

    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        actions: {
          POST: {
            language: {
              choices: [
                { display_name: 'English', value: 'en' },
                { display_name: 'French', value: 'fr' },
              ],
            },
          },
        },
      },
      { method: 'OPTIONS' },
    );

    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/${video.id}`]}>
            <Route path="/:videoId">
              <VideoView />
            </Route>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('heading', { name: 'Video' });
    screen.getByRole('status', { name: 'Loading video...' });

    await act(async () => getVideoDeferred.resolve(video));

    screen.getByRole('heading', { name: video.title });
    screen.getByRole('status', { name: 'Loading subtitles & transcripts...' });

    await act(async () =>
      getTimedTextTracksDeferred.resolve({
        count: 0,
        next: null,
        previous: null,
        results: [],
      }),
    );

    expect(mockCreatePlayer).toHaveBeenCalledWith(
      'videojs',
      expect.any(Element),
      expect.anything(),
      video,
    );
  });

  it('gets the video and shows an uploading message if the video is uploading', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const video = videoMockFactory({ upload_state: uploadState.PENDING });

    const getVideoDeferred = new Deferred();
    fetchMock.get(`/api/videos/${video.id}/`, getVideoDeferred.promise);

    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/${video.id}`]}>
            <Route path="/:videoId">
              <UploadManagerContext.Provider
                value={{
                  setUploadState: jest.fn(),
                  uploadManagerState: {
                    [video.id]: {
                      file,
                      objectId: video.id,
                      objectType: modelName.VIDEOS,
                      progress: 60,
                      status: UploadManagerStatus.UPLOADING,
                    },
                  },
                }}
              >
                <VideoView />
              </UploadManagerContext.Provider>
            </Route>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('heading', { name: 'Video' });
    screen.getByRole('status', { name: 'Loading video...' });

    await act(async () => getVideoDeferred.resolve(video));

    screen.getByRole('heading', { name: video.title });
    screen.getByText(
      'The video is currently being uploaded. You will be able to see it or replace it here after it is processed.',
    );
  });

  it('gets the video and shows a processing message if the video is processing', async () => {
    const video = videoMockFactory({ upload_state: uploadState.PROCESSING });

    const getVideoDeferred = new Deferred();
    fetchMock.get(`/api/videos/${video.id}/`, getVideoDeferred.promise);

    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/${video.id}`]}>
            <Route path="/:videoId">
              <VideoView />
            </Route>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('heading', { name: 'Video' });
    screen.getByRole('status', { name: 'Loading video...' });

    await act(async () => getVideoDeferred.resolve(video));

    screen.getByRole('heading', { name: video.title });
    screen.getByText(
      'The video is currently being processed. You will be able to see it or replace it here after it is finished.',
    );
  });

  it('gets the video and shows an error message when it fails to get the timed text tracks', async () => {
    const video = videoMockFactory();

    const getVideoDeferred = new Deferred();
    fetchMock.get(`/api/videos/${video.id}/`, getVideoDeferred.promise);

    const getTimedTextTracksDeferred = new Deferred();
    fetchMock.get(
      `/api/timedtexttracks/?video=${video.id}&limit=999`,
      getTimedTextTracksDeferred.promise,
    );

    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/${video.id}`]}>
            <Route path="/:videoId">
              <VideoView />
            </Route>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('heading', { name: 'Video' });
    screen.getByRole('status', { name: 'Loading video...' });

    await act(async () => getVideoDeferred.resolve(video));

    screen.getByRole('heading', { name: video.title });
    screen.getByRole('status', { name: 'Loading subtitles & transcripts...' });

    await act(async () => getTimedTextTracksDeferred.resolve(500));

    screen.getByRole('heading', { name: 'There was an unexpected error' });
    screen.getByText(
      'We could not access the appropriate resources. You can try reloading the page or come back again at a later time.',
    );
  });

  it('gets the video and shows the upload form if the video is pending', async () => {
    const video = videoMockFactory({ upload_state: uploadState.PENDING });

    const getVideoDeferred = new Deferred();
    fetchMock.get(`/api/videos/${video.id}/`, getVideoDeferred.promise);

    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/${video.id}`]}>
            <Route path="/:videoId">
              <VideoView />
            </Route>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('heading', { name: 'Video' });
    screen.getByRole('status', { name: 'Loading video...' });

    await act(async () => getVideoDeferred.resolve(video));

    screen.getByRole('heading', { name: video.title });
    screen.getByText(
      'There is currently no video file for this Video. You can add one by dropping or picking a file below.',
    );
    screen.getByRole('button', { name: 'Select a file to upload' });
  });
});

import { cleanup, render, screen, act } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { modelName } from 'types/models';
import { uploadState, Video } from 'types/tracks';
import { report } from 'utils/errors/report';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import {
  UploadManagerContext,
  UploadManagerStatus,
} from 'components/UploadManager';
import { DashboardVideoPane } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: {
    jwt: 'cool_token_m8',
    flags: {},
    uploadPollInterval: 60,
  },
}));
jest.mock('utils/errors/report', () => ({ report: jest.fn() }));
jest.mock('components/DashboardVideoLivePairing', () => ({
  DashboardVideoLivePairing: (props: { video: Video }) => (
    <span title={`Pairing button for ${props.video.id}`} />
  ),
}));

const { ERROR, PENDING, PROCESSING, READY } = uploadState;

describe('<DashboardVideoPane />', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('redirects to error when it fails to fetch the video', async () => {
    const video = videoMockFactory({ upload_state: PROCESSING });
    fetchMock.mock(`/api/videos/${video.id}/`, () => {
      throw new Error('Failed request');
    });
    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoPane video={video} />, [
          {
            path: FULL_SCREEN_ERROR_ROUTE(),
            render: ({ match }) => (
              <span>{`Error Component: ${match.params.code}`}</span>
            ),
          },
        ]),
      ),
    );

    jest.advanceTimersByTime(1000 * 60 + 200);
    await screen.findByText('Error Component: notFound');

    expect(report).toHaveBeenCalledWith(new Error('Failed request'));
  });

  it('renders & starts polling for the video', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const video = videoMockFactory({ upload_state: PENDING });
    let deferred = new Deferred();
    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise);

    const { rerender } = render(
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
        {wrapInIntlProvider(wrapInRouter(<DashboardVideoPane video={video} />))}
      </UploadManagerContext.Provider>,
    );

    screen.getByText('Uploading');
    screen.getByText(
      'Upload in progress... Please do not close or reload this page.',
    );

    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          uploadManagerState: {
            [video.id]: {
              file,
              objectId: video.id,
              objectType: modelName.VIDEOS,
              progress: 60,
              status: UploadManagerStatus.SUCCESS,
            },
          },
        }}
      >
        {wrapInIntlProvider(wrapInRouter(<DashboardVideoPane video={video} />))}
      </UploadManagerContext.Provider>,
    );

    screen.getByText('Processing');
    screen.getByText(
      'Your video is currently processing. This may take up to an hour. You can close the window and come back later.',
    );

    rerender(
      <UploadManagerContext.Provider
        value={{ setUploadState: jest.fn(), uploadManagerState: {} }}
      >
        {wrapInIntlProvider(
          wrapInRouter(
            <DashboardVideoPane
              video={{ ...video, upload_state: PROCESSING }}
            />,
          ),
        )}
      </UploadManagerContext.Provider>,
    );

    // DashboardVideoPane shows the video as PROCESSING
    screen.getByText('Processing');
    screen.getByText(
      'Your video is currently processing. This may take up to an hour. You can close the window and come back later.',
    );
    expect(fetchMock.called()).not.toBeTruthy();

    // First backend call: the video is still processing
    jest.advanceTimersByTime(1000 * 60 + 200);
    await act(async () =>
      deferred.resolve(JSON.stringify({ ...video, upload_state: PROCESSING })),
    );

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });
    screen.getByText('Processing');
    screen.getByText(
      'Your video is currently processing. This may take up to an hour. You can close the window and come back later.',
    );

    // The video will be ready in further responses
    fetchMock.restore();
    deferred = new Deferred();
    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise);

    // Second backend call
    jest.advanceTimersByTime(1000 * 60 + 200);
    await act(async () =>
      deferred.resolve(JSON.stringify({ ...video, upload_state: READY })),
    );

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });

    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoPane video={{ ...video, upload_state: READY }} />,
        ),
      ),
    );

    expect(screen.queryByText('Processing')).toEqual(null);
    expect(
      screen.queryByText(
        'Your video is currently processing. This may take up to an hour. You can close the window and come back later.',
      ),
    ).toEqual(null);
    screen.getByText((content) => content.startsWith('Ready'));
    screen.getByText('Your video is ready to play.');
  });

  it('redirects to error when the video is in the error state and not `is_ready_to_show`', () => {
    const { getByText } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoPane
            video={videoMockFactory({
              is_ready_to_show: false,
              upload_state: ERROR,
            })}
          />,
          [
            {
              path: FULL_SCREEN_ERROR_ROUTE(),
              render: ({ match }) => (
                <span>{`Error Component: ${match.params.code}`}</span>
              ),
            },
          ],
        ),
      ),
    );

    getByText('Error Component: upload');
  });

  it('shows the dashboard when the video is in the error state but `is_ready_to_show`', async () => {
    const { getByText } = render(
      wrapInIntlProvider(
        <DashboardVideoPane
          video={videoMockFactory({
            is_ready_to_show: true,
            upload_state: ERROR,
          })}
        />,
      ),
    );

    getByText((content) => content.startsWith('Error'));
    getByText(
      'There was an error with your video. Retry or upload another one.',
    );
  });

  it('shows the buttons only when the video is pending or ready', async () => {
    for (const state of Object.values(uploadState)) {
      const queryClient = new QueryClient();

      const { getByText, queryByText } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <QueryClientProvider client={queryClient}>
              <DashboardVideoPane
                video={videoMockFactory({
                  is_ready_to_show: false,
                  upload_state: state,
                })}
              />
            </QueryClientProvider>,
          ),
        ),
      );

      switch (state) {
        case PENDING:
          getByText('Upload a video');
          break;

        case READY:
          getByText('Replace the video');
          getByText('Watch');
          break;

        default:
          expect(queryByText('Upload a video')).toEqual(null);
          expect(queryByText('Replace the video')).toEqual(null);
          expect(queryByText('Watch')).toEqual(null);
      }
      await cleanup();
    }
  });

  it('shows the thumbnail only when the video is ready', async () => {
    for (const state of Object.values(uploadState)) {
      const queryClient = new QueryClient();
      const { getByAltText, queryByAltText } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <QueryClientProvider client={queryClient}>
              <DashboardVideoPane
                video={videoMockFactory({
                  is_ready_to_show: false,
                  upload_state: state,
                })}
              />
            </QueryClientProvider>,
          ),
        ),
      );
      if (state === READY) {
        getByAltText('Video thumbnail preview image.');
      } else {
        expect(queryByAltText('Video thumbnail preview image.')).toEqual(null);
      }
      await cleanup();
    }
  });

  it('shows the upload progress when the video is uploading', () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const video = videoMockFactory({
      is_ready_to_show: false,
      upload_state: PENDING,
    });
    render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          uploadManagerState: {
            [video.id]: {
              file,
              objectType: modelName.VIDEOS,
              objectId: video.id,
              progress: 0,
              status: UploadManagerStatus.UPLOADING,
            },
          },
        }}
      >
        {wrapInIntlProvider(wrapInRouter(<DashboardVideoPane video={video} />))}
      </UploadManagerContext.Provider>,
    );

    screen.getByText('0%');
  });

  it('does not show the upload progress when the video is not uploading', () => {
    for (const state of Object.values(uploadState)) {
      const queryClient = new QueryClient();
      render(
        <UploadManagerContext.Provider
          value={{ setUploadState: jest.fn(), uploadManagerState: {} }}
        >
          {wrapInIntlProvider(
            wrapInRouter(
              <QueryClientProvider client={queryClient}>
                <DashboardVideoPane
                  video={videoMockFactory({
                    is_ready_to_show: false,
                    upload_state: state,
                  })}
                />
              </QueryClientProvider>,
            ),
          )}
        </UploadManagerContext.Provider>,
      );
      expect(screen.queryByText('0%')).toEqual(null);
      cleanup();
    }
  });

  it('shows the video harvested dashboard when the video is in HARVESTED state', () => {
    const video = videoMockFactory({
      upload_state: uploadState.HARVESTED,
    });
    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <DashboardVideoPane video={video} />
          </QueryClientProvider>,
        ),
      ),
    );

    screen.getByRole('button', { name: 'watch' });
    screen.getByRole('button', { name: 'publish the video' });
  });
});

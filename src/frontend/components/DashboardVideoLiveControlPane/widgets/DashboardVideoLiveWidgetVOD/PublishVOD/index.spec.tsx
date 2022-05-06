import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import React, { Fragment } from 'react';
import { Toaster } from 'react-hot-toast';

import { useVideo } from 'data/stores/useVideo';
import { videoMockFactory } from 'utils/tests/factories';
import { Deferred } from 'utils/tests/Deferred';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { PublishVOD } from '.';

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
  },
}));

describe('PublishVOD', () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });
  afterEach(() => {
    matchMedia.clear();
    fetchMock.restore();
  });

  it('renders a link to download the video in the best definition possible', () => {
    const video = videoMockFactory({
      urls: {
        manifests: { hls: 'some url' },
        thumbnails: {},
        mp4: { 480: 'my-video-url-480p', 720: 'my-video-url-720p' },
      },
    });

    render(wrapInIntlProvider(<PublishVOD video={video} />));

    expect(
      screen.getByRole('link', { name: 'Download the video' }).closest('a'),
    ).toHaveAttribute('href', 'my-video-url-720p');
  });

  it('raises an error on publish button clicks if request failed', async () => {
    const video = videoMockFactory({
      urls: {
        manifests: { hls: 'some url' },
        thumbnails: {},
        mp4: { 480: 'my-video-url-480p', 720: 'my-video-url-720p' },
      },
    });

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <PublishVOD video={video} />
        </Fragment>,
      ),
    );

    fetchMock.postOnce(`/api/videos/${video.id}/live-to-vod/`, 400);

    userEvent.click(screen.getByRole('button', { name: 'Convert into VOD' }));
    await screen.findByText('An error occurred, please try again later.');
  });

  it('updates the video on publish success', async () => {
    const video = videoMockFactory({
      urls: {
        manifests: { hls: 'some url' },
        thumbnails: {},
        mp4: { 480: 'my-video-url-480p', 720: 'my-video-url-720p' },
      },
    });

    useVideo.setState({
      addResource: jest.fn(),
    });

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <PublishVOD video={video} />
        </Fragment>,
      ),
    );

    const videoDeferred = new Deferred();
    fetchMock.postOnce(
      `/api/videos/${video.id}/live-to-vod/`,
      videoDeferred.promise,
      { overwriteRoutes: false },
    );

    userEvent.click(screen.getByRole('button', { name: 'Convert into VOD' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Convert into VOD' }),
      ).toBeDisabled(),
    );
    expect(useVideo.getState().addResource).not.toHaveBeenCalled();

    await act(async () => videoDeferred.resolve(video));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Convert into VOD' }),
      ).not.toBeDisabled(),
    );
    expect(useVideo.getState().addResource).toHaveBeenCalledWith(video);
  });
});

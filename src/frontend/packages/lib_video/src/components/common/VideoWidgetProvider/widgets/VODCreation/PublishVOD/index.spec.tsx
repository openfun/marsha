/* eslint-disable testing-library/no-node-access */
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt, useVideo } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { Deferred, render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { PublishVOD } from '.';

describe('PublishVOD', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
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

    render(wrapInVideo(<PublishVOD />, video));

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

    render(wrapInVideo(<PublishVOD />, video));

    fetchMock.postOnce(`/api/videos/${video.id}/live-to-vod/`, 400);

    await userEvent.click(
      screen.getByRole('button', { name: 'Convert into VOD' }),
    );

    expect(
      await screen.findByText('An error occurred, please try again later.'),
    ).toBeInTheDocument();
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

    render(wrapInVideo(<PublishVOD />, video));

    const videoDeferred = new Deferred();
    fetchMock.postOnce(
      `/api/videos/${video.id}/live-to-vod/`,
      videoDeferred.promise,
      { overwriteRoutes: false },
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Convert into VOD' }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Convert into VOD/ }),
      ).toBeDisabled(),
    );
    expect(useVideo.getState().addResource).not.toHaveBeenCalled();

    act(() => videoDeferred.resolve(video));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Convert into VOD' }),
      ).not.toBeDisabled(),
    );
    expect(useVideo.getState().addResource).toHaveBeenCalledWith(video);
  });
});

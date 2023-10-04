import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt, useVideo, videoMockFactory } from 'lib-components';
import { Deferred, render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { HarvestVOD } from '.';

describe('HarvestVOD', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('raises an error on harvest button clicks if request failed', async () => {
    const video = videoMockFactory();

    render(wrapInVideo(<HarvestVOD />, video));

    fetchMock.postOnce(`/api/videos/${video.id}/harvest-live/`, 400);

    await userEvent.click(
      screen.getByRole('button', { name: 'Generate file' }),
    );

    expect(
      await screen.findByText('An error occurred, please try again later.'),
    ).toBeInTheDocument();
  });

  it('updates the video on harvest success', async () => {
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

    render(wrapInVideo(<HarvestVOD />, video));

    const videoDeferred = new Deferred();
    fetchMock.postOnce(
      `/api/videos/${video.id}/harvest-live/`,
      videoDeferred.promise,
      { overwriteRoutes: false },
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Generate file' }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Generate file/ }),
      ).toBeDisabled(),
    );
    expect(useVideo.getState().addResource).not.toHaveBeenCalled();

    act(() => videoDeferred.resolve(video));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Generate file' }),
      ).not.toBeDisabled(),
    );
    expect(useVideo.getState().addResource).toHaveBeenCalledWith(video);
  });
});

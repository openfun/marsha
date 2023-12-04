import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { report, useJwt } from 'lib-components';
import {
  sharedLiveMediaMockFactory,
  videoMockFactory,
} from 'lib-components/tests';
import { Deferred, render } from 'lib-tests';

import { ToggleSharing } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<ToggleSharing />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('display correctly the toggle depend the prop isShared', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: faker.string.uuid(),
    });

    const { rerender } = render(
      <ToggleSharing
        isShared={false}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={mockedSharedLiveMedia.video}
      />,
    );

    const input: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Share support',
    });
    expect(input.checked).toEqual(false);

    rerender(
      <ToggleSharing
        isShared={true}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={mockedSharedLiveMedia.video}
      />,
    );

    expect(input.checked).toEqual(true);
  });

  it('shares a support', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: faker.string.uuid(),
    });
    const mockedVideo = videoMockFactory({
      id: mockedSharedLiveMedia.video,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/start-sharing/`, {
      ...mockedVideo,
      active_shared_live_media: mockedSharedLiveMedia,
      active_shared_live_media_page: 1,
    });

    render(
      <ToggleSharing
        isShared={false}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={mockedSharedLiveMedia.video}
      />,
    );

    const input: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Share support',
    });

    await userEvent.click(input);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${mockedVideo.id}/start-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        sharedlivemedia: mockedSharedLiveMedia.id,
      }),
    });
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Shared media updated.');
  });

  it('fails to share a support', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: faker.string.uuid(),
    });
    const mockedVideo = videoMockFactory({
      id: mockedSharedLiveMedia.video,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/start-sharing/`, 500);

    render(
      <ToggleSharing
        isShared={false}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={mockedSharedLiveMedia.video}
      />,
    );

    const input: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Share support',
    });

    await userEvent.click(input);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${mockedVideo.id}/start-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        sharedlivemedia: mockedSharedLiveMedia.id,
      }),
    });
    expect(report).toHaveBeenCalled();
    screen.getByText('Shared media update has failed !');
  });

  it('stops to share a support', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: faker.string.uuid(),
    });
    const mockedVideo = videoMockFactory({
      id: mockedSharedLiveMedia.video,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/end-sharing/`, mockedVideo);

    render(
      <ToggleSharing
        isShared={true}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={mockedSharedLiveMedia.video}
      />,
    );

    const input: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Share support',
    });
    await userEvent.click(input);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${mockedVideo.id}/end-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
    });
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Shared media updated.');
  });

  it('fails to stop to share a support', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: faker.string.uuid(),
    });
    const mockedVideo = videoMockFactory({
      id: mockedSharedLiveMedia.video,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/end-sharing/`, 500);

    render(
      <ToggleSharing
        isShared={true}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={mockedSharedLiveMedia.video}
      />,
    );

    const input: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Share support',
    });
    await userEvent.click(input);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${mockedVideo.id}/end-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
    });
    expect(report).toHaveBeenCalled();
    screen.getByText('Shared media update has failed !');
  });

  it('retries to share if failed because a resource is already sharing', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: faker.string.uuid(),
    });
    const mockedVideo = videoMockFactory({
      id: mockedSharedLiveMedia.video,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    const deferredStartSharing1 = new Deferred();
    const deferredStartSharing2 = new Deferred();
    const deferredEndSharing = new Deferred();

    fetchMock.patchOnce(
      `/api/videos/${mockedVideo.id}/start-sharing/`,
      deferredStartSharing1.promise,
    );

    fetchMock.patchOnce(
      `/api/videos/${mockedVideo.id}/end-sharing/`,
      deferredEndSharing.promise,
    );

    render(
      <ToggleSharing
        isShared={false}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={mockedSharedLiveMedia.video}
      />,
    );

    const input: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Share support',
    });

    await userEvent.click(input);

    deferredStartSharing1.resolve({
      status: 400,
      body: {
        detail: 'Video is already sharing.',
      },
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(
      fetchMock.called(`/api/videos/${mockedVideo.id}/start-sharing/`),
    ).toBeTruthy();

    fetchMock.patchOnce(
      `/api/videos/${mockedVideo.id}/start-sharing/`,
      deferredStartSharing2.promise,
      {
        overwriteRoutes: true,
      },
    );

    deferredEndSharing.resolve(mockedVideo);

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${mockedVideo.id}/end-sharing/`,
      ),
    );

    deferredStartSharing2.resolve({
      ...mockedVideo,
      active_shared_live_media: mockedSharedLiveMedia,
      active_shared_live_media_page: 1,
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(3));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${mockedVideo.id}/start-sharing/`,
    );

    expect(report).not.toHaveBeenCalled();

    expect(
      screen.queryByText('Shared media update has failed !'),
    ).not.toBeInTheDocument();

    expect(screen.getByText('Shared media updated.')).toBeInTheDocument();
  });
});

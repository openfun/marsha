import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { report, sharedLiveMediaMockFactory, useJwt } from 'lib-components';
import { render } from 'lib-tests';

import { ToggleDownload } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<ToggleDownload />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('display correctly the toggle depend the prop isDownloadAllowed', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: faker.string.uuid(),
    });

    const { rerender } = render(
      <ToggleDownload
        isDownloadAllowed={false}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={mockedSharedLiveMedia.video}
      />,
    );

    const input: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Allow download',
    });
    expect(input.checked).toEqual(false);

    rerender(
      <ToggleDownload
        isDownloadAllowed={true}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={mockedSharedLiveMedia.video}
      />,
    );

    expect(input.checked).toEqual(true);
  });

  it('checks the download toggle interaction (allowed / unallowed)', async () => {
    const videoId = faker.string.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      show_download: true,
      video: videoId,
    });

    fetchMock.patchOnce(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
      {
        ...mockedSharedLiveMedia,
        show_download: true,
      },
    );

    render(
      <ToggleDownload
        isDownloadAllowed={false}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={videoId}
      />,
    );

    const input: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Allow download',
    });

    // Allowed
    await userEvent.click(input);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        show_download: true,
      }),
    });
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Shared media updated.');

    fetchMock.patchOnce(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
      {
        ...mockedSharedLiveMedia,
        show_download: false,
      },
      {
        overwriteRoutes: true,
      },
    );

    // Unallowed
    await userEvent.click(input);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        show_download: false,
      }),
    });
    expect(report).not.toHaveBeenCalled();
    expect(screen.getAllByText('Shared media updated.').length).toBe(2);
  });

  it('fails to update the download status', async () => {
    const videoId = faker.string.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();

    fetchMock.patch(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
      500,
    );

    render(
      <ToggleDownload
        isDownloadAllowed={false}
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={videoId}
      />,
    );

    const input: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Allow download',
    });

    await userEvent.click(input);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        show_download: true,
      }),
    });
    expect(report).toHaveBeenCalled();
    screen.getByText('Shared media update has failed !');
  });
});

import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { report, sharedLiveMediaMockFactory, useJwt } from 'lib-components';
import { render } from 'lib-tests';

import { AllowedDownloadButton } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<AllowedDownloadButton />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('clicks on the button and successfully updates the show_download property', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      show_download: true,
      video: videoId,
    });

    fetchMock.patch(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
      {
        ...mockedSharedLiveMedia,
        show_download: false,
      },
    );

    render(
      <AllowedDownloadButton
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={videoId}
      />,
    );

    const allowedDownloadButton = screen.getByRole('button', {
      name: 'Click on this button to stop allowing students to download this media.',
    });

    await userEvent.click(allowedDownloadButton);

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
        show_download: false,
      }),
    });
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Shared media updated.');
  });

  it('clicks on the button and update the show_download property fails', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      show_download: true,
      video: videoId,
    });

    fetchMock.patch(
      `/api/videos/${videoId}/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
      500,
    );

    render(
      <AllowedDownloadButton
        sharedLiveMediaId={mockedSharedLiveMedia.id}
        videoId={videoId}
      />,
    );

    const allowedDownloadButton = screen.getByRole('button');

    await userEvent.click(allowedDownloadButton);

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
        show_download: false,
      }),
    });
    expect(report).toHaveBeenCalled();
    screen.getByText('Shared media update has failed !');
  });
});

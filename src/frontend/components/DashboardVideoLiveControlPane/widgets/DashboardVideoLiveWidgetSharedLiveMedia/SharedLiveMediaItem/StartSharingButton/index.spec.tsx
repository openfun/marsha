import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import React from 'react';

import { report } from 'utils/errors/report';
import {
  videoMockFactory,
  sharedLiveMediaMockFactory,
} from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { StartSharingButton } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
  },
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('<StartSharingButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('clicks on the button and successfully start sharing the shared live media', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/start-sharing/`, {
      ...mockedVideo,
      active_shared_live_media: mockedSharedLiveMedia,
      active_shared_live_media_page: 1,
    });

    render(
      wrapInVideo(
        <StartSharingButton sharedLiveMediaId={mockedSharedLiveMedia.id} />,
        mockedVideo,
      ),
    );

    const startSharingButton = screen.getByRole('button', { name: 'Share' });
    act(() => userEvent.click(startSharingButton));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${mockedVideo.id}/start-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        sharedlivemedia: mockedSharedLiveMedia.id,
      }),
    });
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Shared media updated.');
  });

  it('clicks on the button and the sharing fails', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/start-sharing/`, 500);

    render(
      wrapInVideo(
        <StartSharingButton sharedLiveMediaId={mockedSharedLiveMedia.id} />,
        mockedVideo,
      ),
    );

    const startSharingButton = screen.getByRole('button', { name: 'Share' });
    act(() => userEvent.click(startSharingButton));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${mockedVideo.id}/start-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        sharedlivemedia: mockedSharedLiveMedia.id,
      }),
    });
    expect(report).toHaveBeenCalled();
    screen.getByText('Shared media update has failed !');
  });
});

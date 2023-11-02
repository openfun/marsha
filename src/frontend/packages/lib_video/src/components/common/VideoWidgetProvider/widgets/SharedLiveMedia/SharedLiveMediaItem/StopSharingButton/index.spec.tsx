import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  report,
  sharedLiveMediaMockFactory,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { StopSharingButton } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<StopSharingButton />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('clicks on the button and successfully stop sharing the shared live media', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/end-sharing/`, mockedVideo);

    render(wrapInVideo(<StopSharingButton />, mockedVideo));

    const endSharingButton = screen.getByRole('button', {
      name: 'Stop sharing',
    });
    await userEvent.click(endSharingButton);

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

  it('clicks on the button and the stop sharing fails', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      video: videoId,
    });
    const mockedVideo = videoMockFactory({
      id: videoId,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/end-sharing/`, 500);

    render(wrapInVideo(<StopSharingButton />, mockedVideo));

    const endSharingButton = screen.getByRole('button', {
      name: 'Stop sharing',
    });

    await userEvent.click(endSharingButton);

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
});

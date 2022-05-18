import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import React from 'react';
import toast, { Toast, Toaster, useToaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { report } from 'utils/errors/report';
import {
  videoMockFactory,
  sharedLiveMediaMockFactory,
} from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { StopSharingButton } from '.';

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
  },
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

setLogger({
  log: () => {},
  warn: () => {},
  error: () => {},
});

describe('<StopSharingButton />', () => {
  let getToastHook: () => any = () => {};

  const ToastHack = () => {
    const toasts = useToaster();
    getToastHook = () => toasts;
    return null;
  };

  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
    matchMedia.clear();
    const toasts = getToastHook();
    if (toasts.hasOwnProperty('toasts')) {
      toasts.toasts.forEach((item: Toast) => {
        act(() => {
          toast.remove(item.id);
        });
      });
    }
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
    const queryClient = new QueryClient();

    fetchMock.patch(`/api/videos/${mockedVideo.id}/end-sharing/`, mockedVideo);

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <StopSharingButton video={mockedVideo} />
        </QueryClientProvider>,
      ),
    );

    const endSharingButton = screen.getByRole('button', {
      name: 'Stop sharing',
    });
    act(() => userEvent.click(endSharingButton));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${mockedVideo.id}/end-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
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
    const queryClient = new QueryClient();

    fetchMock.patch(`/api/videos/${mockedVideo.id}/end-sharing/`, 500);

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <StopSharingButton video={mockedVideo} />
        </QueryClientProvider>,
      ),
    );

    const endSharingButton = screen.getByRole('button', {
      name: 'Stop sharing',
    });
    act(() => userEvent.click(endSharingButton));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${mockedVideo.id}/end-sharing/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    });
    expect(report).toHaveBeenCalled();
    screen.getByText('Shared media update has failed !');
  });
});

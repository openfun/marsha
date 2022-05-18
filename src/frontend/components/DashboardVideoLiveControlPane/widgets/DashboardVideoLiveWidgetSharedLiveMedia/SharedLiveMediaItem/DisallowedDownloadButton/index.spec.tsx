import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import React from 'react';
import toast, { Toast, Toaster, useToaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { report } from 'utils/errors/report';
import { sharedLiveMediaMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DisallowedDownloadButton } from '.';

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

describe('<DisallowedDownloadButton />', () => {
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

  it('clicks on the button and successfully updates the show_download property', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      show_download: false,
      video: videoId,
    });
    const queryClient = new QueryClient();

    fetchMock.patch(`/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`, {
      ...mockedSharedLiveMedia,
      show_download: true,
    });

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <DisallowedDownloadButton
            sharedLiveMediaId={mockedSharedLiveMedia.id}
          />
        </QueryClientProvider>,
      ),
    );

    const disallowedDownloadButton = screen.getByRole('button', {
      name: 'Click on this button to allow students to download the media.',
    });
    act(() => userEvent.click(disallowedDownloadButton));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        show_download: true,
      }),
    });
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Shared media updated.');
  });

  it('clicks on the button and update the show_download property fails', async () => {
    const videoId = faker.datatype.uuid();
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      show_download: false,
      video: videoId,
    });
    const queryClient = new QueryClient();

    fetchMock.patch(`/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`, 500);

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <DisallowedDownloadButton
            sharedLiveMediaId={mockedSharedLiveMedia.id}
          />
        </QueryClientProvider>,
      ),
    );

    const disallowedDownloadButton = screen.getByRole('button', {
      name: 'Click on this button to allow students to download the media.',
    });
    act(() => userEvent.click(disallowedDownloadButton));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
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

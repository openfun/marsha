import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import React from 'react';
import toast, { Toast, Toaster, useToaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { report } from 'utils/errors/report';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveWidgetVisibilityAndInteraction } from '.';

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

// Even if its depreciated, it's what is used under-the-hood in the clipboard.js librairy
document.execCommand = jest.fn();

describe('<DashboardVideoLiveWidgetVisibilityAndInteraction />', () => {
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

  it('renders the widget', () => {
    const mockedVideo = videoMockFactory({
      is_public: true,
    });
    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetVisibilityAndInteraction
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    screen.getByText('Visibility and interaction parameters');

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).toBeChecked();
    screen.getByText('Make the video publicly available');

    screen.getByText('https://localhost/videos/'.concat(mockedVideo.id));
    screen.getByRole('button', {
      name: "A button to copy the video's publicly available url in clipboard",
    });
  });

  it('clicks on the toggle button to make the video publicly available, and copy the url in clipboard', async () => {
    const mockedVideo = videoMockFactory({
      is_public: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      is_public: true,
    });

    const queryClient = new QueryClient();

    const { rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetVisibilityAndInteraction
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).not.toBeChecked();

    expect(
      screen.queryByRole('button', {
        name: "A button to copy the video's publicly available url in clipboard",
      }),
    ).toBe(null);
    expect(
      screen.queryByText('https://localhost/videos/'.concat(mockedVideo.id)),
    );

    await act(async () => userEvent.click(visibilityToggleButton));
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        is_public: true,
      }),
    });
    expect(visibilityToggleButton).toBeChecked();
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');

    // simulate video update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetVisibilityAndInteraction
              video={{ ...mockedVideo, is_public: true }}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    const copyButtonReRendered = screen.getByRole('button', {
      name: "A button to copy the video's publicly available url in clipboard",
    });
    expect(copyButtonReRendered).not.toBeDisabled();
    screen.getByText('https://localhost/videos/'.concat(mockedVideo.id));
    expect(document.execCommand).toHaveBeenCalledTimes(0);
    act(() => userEvent.click(copyButtonReRendered));
    expect(document.execCommand).toHaveBeenCalledTimes(1);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    screen.getByText('Url copied in clipboard !');
  });

  it('clicks on the toggle button to make the video private', async () => {
    const mockedVideo = videoMockFactory({
      is_public: true,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      is_public: false,
    });

    const queryClient = new QueryClient();

    const { rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetVisibilityAndInteraction
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).toBeChecked();
    screen.getByText('https://localhost/videos/'.concat(mockedVideo.id));
    const copyButton = screen.getByRole('button', {
      name: "A button to copy the video's publicly available url in clipboard",
    });
    expect(copyButton).not.toBeDisabled();

    await act(async () => userEvent.click(visibilityToggleButton));
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        is_public: false,
      }),
    });
    expect(visibilityToggleButton).not.toBeChecked();
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');

    // simulate video update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetVisibilityAndInteraction
              video={{ ...mockedVideo, is_public: false }}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    expect(
      screen.queryByRole('button', {
        name: "A button to copy the video's publicly available url in clipboard",
      }),
    );
    expect(
      screen.queryByText('https://localhost/videos/'.concat(mockedVideo.id)),
    );
  });

  it('clicks on the toggle button to make the video publicly available, but backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      is_public: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 500);

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetVisibilityAndInteraction
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).not.toBeChecked();

    await act(async () => userEvent.click(visibilityToggleButton));
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        is_public: true,
      }),
    });
    expect(visibilityToggleButton).not.toBeChecked();
    expect(report).toHaveBeenCalled();
    screen.getByText('Video update has failed !');
  });
});

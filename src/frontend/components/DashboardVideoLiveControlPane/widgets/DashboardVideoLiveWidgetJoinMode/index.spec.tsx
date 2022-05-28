import { act, render, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import React from 'react';
import toast, { Toast, Toaster, useToaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { report } from 'utils/errors/report';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { JoinMode } from 'types/tracks';
import { DashboardVideoLiveWidgetJoinMode } from '.';

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

window.scrollTo = jest.fn();

describe('<DashboardVideoLiveWidgetJoinMode />', () => {
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
      join_mode: JoinMode.APPROVAL,
    });
    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <DashboardVideoLiveWidgetJoinMode video={mockedVideo} />
        </QueryClientProvider>,
      ),
    );

    screen.getByText('Join the discussion');
    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');
  });

  it('selects join mode denied', async () => {
    const mockedVideo = videoMockFactory({
      join_mode: JoinMode.APPROVAL,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      join_mode: JoinMode.DENIED,
    });

    const queryClient = new QueryClient();

    const { rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <DashboardVideoLiveWidgetJoinMode video={mockedVideo} />
        </QueryClientProvider>,
      ),
    );

    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');

    userEvent.click(button);
    await act(async () => {
      userEvent.click(screen.getByText(/not allowed/i));
    });

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        join_mode: 'denied',
      }),
    });
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');

    // simulate video update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <DashboardVideoLiveWidgetJoinMode
            video={{ ...mockedVideo, join_mode: JoinMode.DENIED }}
          />
        </QueryClientProvider>,
      ),
    );
    expect(within(button).getByRole('textbox')).toHaveValue('Not allowed');
  });

  it('selects join mode ask for approval', async () => {
    const mockedVideo = videoMockFactory({
      join_mode: JoinMode.DENIED,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      join_mode: JoinMode.APPROVAL,
    });

    const queryClient = new QueryClient();

    const { rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <DashboardVideoLiveWidgetJoinMode video={mockedVideo} />
        </QueryClientProvider>,
      ),
    );

    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Not allowed');

    userEvent.click(button);
    await act(async () => {
      userEvent.click(
        screen.getByText(/Accept joining the discussion after approval/i),
      );
    });

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        join_mode: 'approval',
      }),
    });
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');

    // simulate video update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <DashboardVideoLiveWidgetJoinMode
            video={{ ...mockedVideo, join_mode: JoinMode.APPROVAL }}
          />
        </QueryClientProvider>,
      ),
    );
    expect(within(button).getByRole('textbox')).toHaveValue(
      'Accept joining the discussion after approval',
    );
  });

  it('selects join mode forced', async () => {
    const mockedVideo = videoMockFactory({
      join_mode: JoinMode.APPROVAL,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      join_mode: JoinMode.FORCED,
    });

    const queryClient = new QueryClient();

    const { rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <DashboardVideoLiveWidgetJoinMode video={mockedVideo} />
        </QueryClientProvider>,
      ),
    );

    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');

    userEvent.click(button);
    await act(async () => {
      userEvent.click(screen.getByText(/everybody will join the discussion/i));
    });

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        join_mode: 'forced',
      }),
    });
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');

    // simulate video update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <DashboardVideoLiveWidgetJoinMode
            video={{ ...mockedVideo, join_mode: JoinMode.FORCED }}
          />
        </QueryClientProvider>,
      ),
    );
    expect(within(button).getByRole('textbox')).toHaveValue(
      'Everybody will join the discussion',
    );
  });

  it('selects join mode denied, but backend returns an error', async () => {
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
          <DashboardVideoLiveWidgetJoinMode video={mockedVideo} />
        </QueryClientProvider>,
      ),
    );

    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');

    userEvent.click(button);
    await act(async () => {
      userEvent.click(screen.getByText(/not allowed/i));
    });

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        join_mode: 'denied',
      }),
    });
    expect(report).toHaveBeenCalled();
    screen.getByText('Video update has failed !');
  });
});

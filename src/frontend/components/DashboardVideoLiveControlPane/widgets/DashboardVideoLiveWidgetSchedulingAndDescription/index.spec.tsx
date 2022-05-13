import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import { DateTime, Duration } from 'luxon';
import React from 'react';
import toast, { Toast, Toaster, useToaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { report } from 'utils/errors/report';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveWidgetSchedulingAndDescription } from '.';

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

const currentDate = DateTime.fromISO('2022-01-01T12:00');

describe('<DashboardVideoLiveWidgetSchedulingAndDescription />', () => {
  let getToastHook: () => any = () => {};

  const ToastHack = () => {
    const toasts = useToaster();
    getToastHook = () => toasts;
    return null;
  };

  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(currentDate.toJSDate());
  });
  afterEach(() => {
    fetchMock.restore();
    const toasts = getToastHook();
    if (toasts.hasOwnProperty('toasts')) {
      toasts.toasts.forEach((item: Toast) => {
        act(() => {
          toast.remove(item.id);
        });
      });
    }
  });
  afterAll(() => {
    jest.resetAllMocks();
    matchMedia.clear();
    jest.useRealTimers();
  });

  it('renders the widgets', () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });

    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: 'An example description',
      starting_at: startingAt.toString(),
      estimated_duration: estimatedDuration.toISOTime({
        suppressMilliseconds: true,
      }),
    });

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetSchedulingAndDescription
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    screen.getByText('Description');

    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    expect(inputStartingAtDate).toHaveValue('2022/01/03');
    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    expect(inputStartingAtTime).toHaveValue('14:00');
    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    expect(inputEstimatedDuration).toHaveValue('0:30');
    screen.getByText("Webinar's end");
    screen.getByText('2022/01/03, 14:30');

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An example description');
    screen.getByPlaceholderText('Description...');
  });

  it('schedules a meeting', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });

    const mockedVideo = videoMockFactory({
      id: 'video_id',
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      starting_at: startingAt,
    });
    const queryClient = new QueryClient();

    const { rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetSchedulingAndDescription
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    screen.getByText('Your live is not scheduled');
    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    fireEvent.change(inputStartingAtDate, {
      target: { value: startingAt.toFormat('yyyy/MM/dd') },
    });
    expect(inputStartingAtDate).toHaveValue('2022/01/03');
    expect(fetchMock.calls()).toHaveLength(0);

    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    expect(inputStartingAtTime).toHaveValue('14:00');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        starting_at: startingAt,
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
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetSchedulingAndDescription
              video={{ ...mockedVideo, starting_at: startingAt.toString() }}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );
    expect(screen.queryByText('Your live is not scheduled')).toEqual(null);
    screen.getByText("Webinar's end");

    fetchMock.patch(
      '/api/videos/video_id/',
      {
        ...mockedVideo,
        estimated_duration: estimatedDuration,
      },
      { overwriteRoutes: true },
    );

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    fireEvent.change(inputEstimatedDuration, {
      target: { value: estimatedDuration.toFormat('h:mm') },
    });
    expect(inputEstimatedDuration).toHaveValue('0:30');

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        estimated_duration: estimatedDuration.toISOTime({
          suppressMilliseconds: true,
        }),
      }),
    });
    expect(report).not.toHaveBeenCalled();
    expect(screen.getAllByText('Video updated.')).toHaveLength(2);

    // simulate video update
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetSchedulingAndDescription
              video={{
                ...mockedVideo,
                starting_at: startingAt.toString(),
                estimated_duration: estimatedDuration.toISOTime(),
              }}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );
    expect(screen.queryByText('Your live is not scheduled')).toEqual(null);
    screen.getByText("Webinar's end");
    screen.getByText('2022/01/03, 14:30');
  });

  it('schedules a webinar but the API returns error', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });

    const mockedVideo = videoMockFactory({
      id: 'video_id',
    });

    fetchMock.patch('/api/videos/video_id/', 500);
    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetSchedulingAndDescription
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );
    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    fireEvent.change(inputStartingAtDate, {
      target: { value: startingAt.toFormat('yyyy/MM/dd') },
    });
    expect(fetchMock.calls()).toHaveLength(0);

    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));

    expect(report).toHaveBeenCalledTimes(1);
    screen.getByText('Video update has failed !');

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    fireEvent.change(inputEstimatedDuration, {
      target: { value: estimatedDuration.toFormat('h:mm') },
    });
    // API is called a second time, so a second fetch is performed, and a second toast comes on the screen
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));
    expect(report).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('Video update has failed !')).toHaveLength(2);
  });

  it('displays a scheduled webinar in fr zone', () => {
    // It prevents console to display error when french translations doen't exist
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

    const date = DateTime.fromISO('2022-01-01T12:00');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });

    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: 'An example description',
      starting_at: date.toString(),
      estimated_duration: estimatedDuration.toISOTime({
        suppressMilliseconds: true,
      }),
    });

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetSchedulingAndDescription
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
        'fr',
      ),
    );

    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    expect(inputStartingAtDate).toHaveValue('01/01/2022');
    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    expect(inputStartingAtTime).toHaveValue('12:00');
    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    expect(inputEstimatedDuration).toHaveValue('0:30');

    screen.getByText("Webinar's end");
    screen.getByText('01/01/2022, 12:30');
  });

  it('types some text in an empty text area', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: undefined,
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      description: 'A new description',
    });

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetSchedulingAndDescription
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    screen.getByPlaceholderText('Description...');
    expect(textArea).toHaveValue('');

    userEvent.type(textArea, 'A new description');
    expect(textArea).toHaveValue('A new description');

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        description: 'A new description',
      }),
    });
    screen.getByText('Video updated.');
  });

  it('clears the text area', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: 'An existing description',
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      description: '',
    });

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetSchedulingAndDescription
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An existing description');

    userEvent.clear(textArea);
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        description: '',
      }),
    });
    expect(textArea).toHaveValue('');
    screen.getByText('Video updated.');
  });

  it('modifies the text area, but the API returns an error', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: 'An existing description',
    });

    fetchMock.patch('/api/videos/video_id/', 500);

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <ToastHack />
          <InfoWidgetModalProvider value={null}>
            <DashboardVideoLiveWidgetSchedulingAndDescription
              video={mockedVideo}
            />
          </InfoWidgetModalProvider>
        </QueryClientProvider>,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An existing description');

    userEvent.type(textArea, ' and more');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        description: 'An existing description and more',
      }),
    });
    expect(textArea).toHaveValue('An existing description');
    screen.getByText('Video update has failed !');
  });
});

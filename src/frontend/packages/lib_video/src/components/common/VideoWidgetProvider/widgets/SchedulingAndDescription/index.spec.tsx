import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEventInit from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  liveState,
  report,
  useJwt,
} from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render, userTypeDatePicker } from 'lib-tests';
import { DateTime, Duration } from 'luxon';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { SchedulingAndDescription } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const currentDate = DateTime.fromISO('2022-01-01T12:00');

const userEvent = userEventInit.setup({
  advanceTimers: jest.advanceTimersByTime,
});

describe('<SchedulingAndDescription />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });

    jest.useFakeTimers();
    jest.setSystemTime(currentDate.toJSDate());
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
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

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <SchedulingAndDescription />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Description');

    const inputStartingAtDate = within(
      screen.getByTestId('starting-at-date-picker'),
    ).getByRole('presentation');
    expect(inputStartingAtDate).toHaveTextContent('1/3/2022');
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
    expect(screen.getByText('Description...')).toBeInTheDocument();
  });

  it('schedules a meeting', async () => {
    const startingAt = currentDate.plus({ days: 2, hours: 2 }).startOf('hour');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });

    const mockedVideo = videoMockFactory({
      id: 'video_id',
      live_state: liveState.IDLE,
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      starting_at: startingAt,
    });

    const { rerender } = render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <SchedulingAndDescription />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Your live is not scheduled');

    await userTypeDatePicker(
      startingAt,
      screen.getByText(/Starting date/i),
      userEvent,
    );

    const inputStartingAtDate = within(
      screen.getByTestId('starting-at-date-picker'),
    ).getByRole('presentation');

    expect(inputStartingAtDate).toHaveTextContent('1/3/2022');
    expect(fetchMock.calls()).toHaveLength(0);

    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    expect(inputStartingAtTime).toHaveValue('14:00');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1), {
      timeout: 1500,
    });
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <SchedulingAndDescription />
        </InfoWidgetModalProvider>,
        { ...mockedVideo, starting_at: startingAt.toString() },
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

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2), {
      timeout: 1500,
    });
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <SchedulingAndDescription />
        </InfoWidgetModalProvider>,
        {
          ...mockedVideo,
          starting_at: startingAt.toString(),
          estimated_duration: estimatedDuration.toISOTime(),
        },
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
      live_state: liveState.IDLE,
    });

    fetchMock.patch('/api/videos/video_id/', 500);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <SchedulingAndDescription />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    await userTypeDatePicker(
      startingAt,
      screen.getByText(/Starting date/i),
      userEvent,
    );

    expect(fetchMock.calls()).toHaveLength(0);

    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1), {
      timeout: 1500,
    });

    expect(report).toHaveBeenCalledTimes(1);
    screen.getByText('Video update has failed !');

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    fireEvent.change(inputEstimatedDuration, {
      target: { value: estimatedDuration.toFormat('h:mm') },
    });
    // API is called a second time, so a second fetch is performed, and a second toast comes on the screen
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2), {
      timeout: 1500,
    });
    expect(report).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('Video update has failed !')).toHaveLength(2);
  });

  it('displays a scheduled webinar in fr zone', () => {
    // It prevents console to display error when french translations doen't exist
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

    const date = DateTime.fromISO('2022-03-21T12:00');
    const estimatedDuration = Duration.fromObject({ minutes: 30 });

    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: 'An example description',
      starting_at: date.toString(),
      estimated_duration: estimatedDuration.toISOTime({
        suppressMilliseconds: true,
      }),
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <SchedulingAndDescription />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr' } },
    );

    const inputStartingAtDate = within(
      screen.getByTestId('starting-at-date-picker'),
    ).getByRole('presentation');
    expect(inputStartingAtDate).toHaveTextContent('21/03/2022');
    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    expect(inputStartingAtTime).toHaveValue('12:00');
    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    expect(inputEstimatedDuration).toHaveValue('0:30');

    screen.getByText("Webinar's end");
    screen.getByText('21/03/2022, 12:30');
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

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <SchedulingAndDescription />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(screen.getByText('Description...')).toBeInTheDocument();
    expect(textArea).toHaveValue('');

    await userEvent.type(textArea, 'A new description');
    expect(textArea).toHaveValue('A new description');

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1), {
      timeout: 1500,
    });
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <SchedulingAndDescription />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An existing description');

    await userEvent.clear(textArea);
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1), {
      timeout: 1500,
    });
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <SchedulingAndDescription />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An existing description');

    await userEvent.type(textArea, ' and more');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1), {
      timeout: 1500,
    });
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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

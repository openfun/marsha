import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { videoMockFactory, useVideo } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import { QueryClient } from 'react-query';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { StopRecording } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

let queryClient: QueryClient;

describe('<StopRecording />', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  it('updates the video on success', async () => {
    const mockAddResource = jest.fn();
    useVideo.setState({
      addResource: mockAddResource,
    });
    const video = videoMockFactory();
    fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, video);
    fetchMock.mock('/api/videos/', {
      live: {
        segment_duration_seconds: 1,
      },
    });

    render(wrapInVideo(<StopRecording />, video), {
      queryOptions: { client: queryClient },
    });
    const button = screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' });
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(fetchMock.called('/api/videos/')).toBe(true);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => expect(button).toBeEnabled());
    userEvent.click(button);

    await waitFor(() => expect(mockAddResource).toHaveBeenCalled());
    expect(mockAddResource).toHaveBeenCalledWith(video);
  });

  it('renders a toast on error', async () => {
    const video = videoMockFactory();
    fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, 400);
    fetchMock.mock('/api/videos/', {
      live: {
        segment_duration_seconds: 1,
      },
    });

    render(wrapInVideo(<StopRecording />, video), {
      queryOptions: { client: queryClient },
    });

    const button = screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' });

    await waitFor(() => {
      expect(fetchMock.called('/api/videos/')).toBe(true);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => expect(button).toBeEnabled());

    userEvent.click(button);

    await screen.findByText('An error occured. Please try again later.');
  });

  it('renders current recorded time', () => {
    const video = videoMockFactory({ recording_time: 3722 });
    fetchMock.mock('/api/videos/', {
      live: {
        segment_duration_seconds: 1,
      },
    });

    render(wrapInVideo(<StopRecording />, video), {
      queryOptions: { client: queryClient },
    });

    expect(
      screen.getByRole('button', { name: 'REC 0 1 : 0 2 : 0 2' }),
    ).toBeInTheDocument();
  });
});

import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useVideo } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

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
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
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
        segment_duration_seconds: 0.1,
      },
    });

    render(wrapInVideo(<StopRecording />, video), {
      queryOptions: { client: queryClient },
    });
    const button = screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' });
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(
        fetchMock.called('/api/videos/', {
          method: 'OPTIONS',
        }),
      ).toBe(true);
    });

    await waitFor(() => {
      expect(button).toBeEnabled();
    });

    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);

    await waitFor(() => expect(mockAddResource).toHaveBeenCalled());
    expect(mockAddResource).toHaveBeenCalledWith(video);
  });

  it('renders a toast on error', async () => {
    const video = videoMockFactory();
    fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, 400);
    fetchMock.mock('/api/videos/', {
      live: {
        segment_duration_seconds: 0.1,
      },
    });

    render(wrapInVideo(<StopRecording />, video), {
      queryOptions: { client: queryClient },
    });

    const button = screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' });

    await waitFor(() => {
      expect(fetchMock.called('/api/videos/')).toBe(true);
    });

    await waitFor(() => expect(button).toBeEnabled());

    await userEvent.click(button);

    await screen.findByText('An error occured. Please try again later.');
  });

  it('renders current recorded time', async () => {
    const video = videoMockFactory({ recording_time: 3722 });
    fetchMock.mock('/api/videos/', 200);

    render(wrapInVideo(<StopRecording />, video), {
      queryOptions: { client: queryClient },
    });

    expect(
      await screen.findByRole('button', { name: 'REC 0 1 : 0 2 : 0 2' }),
    ).toBeInTheDocument();
  });
});

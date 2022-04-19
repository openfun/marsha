import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';
import { report } from 'utils/errors/report';

import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveWidgetGeneralTitle } from '.';

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  appData: {
    resource: {
      id: '1',
    },
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

describe('test toggle button in <DashboardVideoLiveWidgetGeneralTitle />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    matchMedia = new MatchMediaMock();
  });
  afterEach(() => {
    fetchMock.restore();
    matchMedia.clear();
  });

  it('clicks on the toggle button for activate the live recording', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      allow_recording: false,
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      allow_recording: true,
    });
    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardVideoLiveWidgetGeneralTitle video={mockedVideo} />,
        </QueryClientProvider>,
      ),
    );

    screen.getByText('Activate live recording');
    const recordingToggleButton = screen.getByRole('checkbox', {
      name: 'Activate live recording',
    });

    await act(async () => userEvent.click(recordingToggleButton));
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        allow_recording: true,
      }),
    });
    expect(report).not.toHaveBeenCalled();
  });

  it('clicks on the toggle button for deactivate the live recording', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      allow_recording: true,
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      allow_recording: false,
    });

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardVideoLiveWidgetGeneralTitle video={mockedVideo} />,
        </QueryClientProvider>,
      ),
    );

    screen.getByText('Activate live recording');
    const recordingToggleButton = screen.getByRole('checkbox', {
      name: 'Activate live recording',
    });

    await act(async () => userEvent.click(recordingToggleButton));
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        allow_recording: false,
      }),
    });
    expect(report).not.toHaveBeenCalled();
  });

  it('clicks on the toggle button for activate live recording, but backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      allow_recording: false,
    });

    fetchMock.patch('/api/videos/video_id/', 500);

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardVideoLiveWidgetGeneralTitle video={mockedVideo} />,
        </QueryClientProvider>,
      ),
    );

    screen.getByText('Activate live recording');

    const recordingToggleButton = screen.getByRole('checkbox', {
      name: 'Activate live recording',
    });
    await act(async () => userEvent.click(recordingToggleButton));

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        allow_recording: true,
      }),
    });
    screen.getAllByText('Recording activation status update has failed !');
  });
});

describe('test text input in <DashboardVideoLiveWidgetGeneralTitle />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    matchMedia = new MatchMediaMock();
  });
  afterEach(() => {
    fetchMock.restore();
    matchMedia.clear();
  });

  it('types some text in an empty input text', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      title: null,
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      title: 'An example text',
    });

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardVideoLiveWidgetGeneralTitle video={mockedVideo} />,
        </QueryClientProvider>,
      ),
    );

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your live here',
    });
    screen.getByText('Enter title of your live here');
    expect(textInput).toHaveValue('');

    userEvent.type(textInput, 'An example text');
    expect(textInput).toHaveValue('An example text');

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'An example text',
      }),
    });
    screen.getByText('Title updated.');
  });

  it('clears the input text', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      title: 'An existing title',
    });

    fetchMock.patch('/api/videos/video_id/', {
      title: ['This field may not be blank.'],
    });

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardVideoLiveWidgetGeneralTitle video={mockedVideo} />,
        </QueryClientProvider>,
      ),
    );

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your live here',
    });
    expect(textInput).toHaveValue('An existing title');

    userEvent.clear(textInput);
    expect(fetchMock.calls()).toHaveLength(0);
    await waitFor(() => expect(textInput).toHaveValue('An existing title'));
    screen.getByText("Title can't be blank !");
  });

  it('modifies the input text, but the backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      title: 'An existing title',
    });

    fetchMock.patch('/api/videos/video_id/', 500);

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardVideoLiveWidgetGeneralTitle video={mockedVideo} />,
        </QueryClientProvider>,
      ),
    );

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your live here',
    });
    expect(textInput).toHaveValue('An existing title');

    userEvent.type(textInput, ' and more');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'An existing title and more',
      }),
    });
    expect(textInput).toHaveValue('An existing title');
    screen.getByText('Title update has failed !');
  });
});

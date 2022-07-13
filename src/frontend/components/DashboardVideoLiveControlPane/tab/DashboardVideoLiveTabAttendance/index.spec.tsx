import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient } from 'react-query';

import { liveState } from 'types/tracks';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { DashboardVideoLiveTabAttendance } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  },
}));
jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));
const mockedVideo = videoMockFactory({ live_state: liveState.RUNNING });

describe('<DashboardVideoLiveTabAttendance />', () => {
  jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

  afterEach(() => fetchMock.restore());

  it('renders the list of attendance', async () => {
    const deferred = new Deferred();
    fetchMock.mock(
      '/api/livesessions/list_attendances/?limit=999',
      deferred.promise,
    );
    render(wrapInVideo(<DashboardVideoLiveTabAttendance />, mockedVideo));

    screen.getByText('Loading attendances...');

    deferred.resolve({
      count: 3,
      next: null,
      previous: null,
      results: [
        {
          id: '34d73670-885c-4a84-b208-8246bfd05949',
          display_name: 'qbrooks',
          is_registered: false,
          live_attendance: {
            1654182083: {},
            1654182099: {
              muted: false,
              volume: 1,
              playing: true,
              timestamp: 1654182099,
              fullScreen: false,
              player_timer: 175.964861,
            },
            1654182115: {
              muted: false,
              volume: 1,
              playing: true,
              timestamp: 1654182115,
              fullScreen: false,
              player_timer: 186.971211,
            },
            1654182131: {
              muted: false,
              volume: 1,
              playing: true,
              timestamp: 1654182131,
              fullScreen: false,
              player_timer: 207.525995,
            },
            1654182147: {
              muted: false,
              volume: 1,
              playing: true,
              timestamp: 1654182147,
              fullScreen: false,
              player_timer: 228.33815,
            },
            1654182163: {
              muted: false,
              volume: 1,
              playing: true,
              timestamp: 1654182163,
              fullScreen: false,
              player_timer: 233,
            },
          },
        },
        {
          id: 'c4aed19d-8df6-48d9-8525-bd2ad60ae98a',
          display_name: 'qparker',
          is_registered: false,
          live_attendance: {
            1654182083: {},
            1654182099: {},
            1654182115: {},
            1654182131: {
              muted: false,
              volume: 1,
              playing: true,
              timestamp: 1654182131,
              fullScreen: false,
              player_timer: 207.525995,
            },
            1654182147: {
              muted: false,
              volume: 1,
              playing: true,
              timestamp: 1654182147,
              fullScreen: false,
              player_timer: 228.33815,
            },
            1654182163: {
              muted: false,
              volume: 1,
              playing: true,
              timestamp: 1654182163,
              fullScreen: false,
              player_timer: 233,
            },
          },
        },
        {
          id: 'd4aed19d-8df6-48d9-8525-bd2ad60ae98a',
          display_name: 'sam',
          is_registered: false,
          live_attendance: {
            1654182083: {},
            1654182099: {},
            1654182115: {},
            1654182131: {},
            1654182147: {},
            1654182163: {},
          },
        },
      ],
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/livesessions/list_attendances/?limit=999`,
    );
    // 3 results are displayed
    expect(screen.getAllByTestId('live-attendance').length).toEqual(3);

    screen.getByLabelText('Very diligent');
    screen.getByText('qbrooks');
    screen.getByText('83 %');
    screen.getByLabelText('Partially present');
    screen.getByText('qparker');
    screen.getByText('50 %');
    screen.getByLabelText('Missed the live');
    screen.getByText('sam');
    screen.getByText('-');
  });

  it('displays the default message when video has no live_state', async () => {
    render(
      wrapInVideo(<DashboardVideoLiveTabAttendance />, {
        ...mockedVideo,
        live_state: null,
      }),
    );

    screen.getByText('The live has no participant yet');
  });

  it('displays the default message when video has an IDLE live_state', async () => {
    render(
      wrapInVideo(<DashboardVideoLiveTabAttendance />, {
        ...mockedVideo,
        live_state: liveState.IDLE,
      }),
    );

    screen.getByText('The live has no participant yet');
  });

  it('displays the default message when there is no attendance', async () => {
    const deferred = new Deferred();
    fetchMock.mock(
      '/api/livesessions/list_attendances/?limit=999',
      deferred.promise,
    );

    render(wrapInVideo(<DashboardVideoLiveTabAttendance />, mockedVideo));

    deferred.resolve({ count: 0, next: null, previous: null, results: [] });

    await screen.findByText('The live has no participant yet');
  });

  it('shows an error message when it fails to get the list of attendances', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const deferred = new Deferred();
    fetchMock.get(
      '/api/livesessions/list_attendances/?limit=999',
      deferred.promise,
    );

    render(wrapInVideo(<DashboardVideoLiveTabAttendance />, mockedVideo), {
      queryOptions: { client: queryClient },
    });

    deferred.resolve(500);

    await screen.findByRole('heading', {
      name: 'There was an unexpected error',
    });
    screen.getByText(
      'We could not access the appropriate resources. You can try reloading the page or come back again at a later time.',
    );
  });
});

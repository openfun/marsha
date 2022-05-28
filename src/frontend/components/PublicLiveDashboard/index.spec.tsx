import {
  act,
  cleanup,
  render,
  waitFor,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import React from 'react';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { StudentLiveWrapper } from 'components/StudentLiveWrapper';
import { getDecodedJwt } from 'data/appData';
import { pollForLive } from 'data/sideEffects/pollForLive';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { modelName } from 'types/models';
import { JoinMode, Live, liveState } from 'types/tracks';
import { initWebinarContext } from 'utils/initWebinarContext';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { PublicLiveDashboard } from '.';

jest.mock('data/appData', () => ({
  appData: {
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  },
  getDecodedJwt: jest.fn(),
}));
const mockedGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;

jest.mock('data/sideEffects/pollForLive', () => ({
  pollForLive: jest.fn(),
}));
const mockedPollForLive = pollForLive as jest.MockedFunction<
  typeof pollForLive
>;

jest.mock('utils/initWebinarContext', () => ({
  initWebinarContext: jest.fn(),
}));
const mockedInitWebinarContext = initWebinarContext as jest.MockedFunction<
  typeof initWebinarContext
>;

jest.mock('components/StudentLiveWrapper', () => ({
  StudentLiveWrapper: jest.fn().mockImplementation(() => <p>live wrapper</p>),
}));
const mockedStudentLiveWrapper = StudentLiveWrapper as jest.MockedFunction<
  typeof StudentLiveWrapper
>;

describe('PublicLiveDashboard', () => {
  beforeEach(() => {
    mockedGetDecodedJwt.mockReturnValue({
      locale: 'en',
      maintenance: false,
      resource_id: 'id',
      permissions: { can_update: false, can_access_dashboard: false },
      roles: [],
      session_id: 'session-id',
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('inits websocket context', async () => {
    const values = Object.values(liveState);

    for (const state of values) {
      if (state === liveState.ENDED) {
        //  running live state ignores liveState.ENDED
        //  but typescript fail to detect type with a filter
        return;
      }

      const video = videoMockFactory();
      const live: Live = { ...video, live_state: state };

      const deferred = new Deferred<void>();
      mockedInitWebinarContext.mockReturnValue(deferred.promise);

      render(
        wrapInIntlProvider(
          <PublicLiveDashboard live={live} playerType={'videojs'} />,
        ),
      );

      const loader = screen.getByRole('status');

      deferred.resolve();
      await waitForElementToBeRemoved(loader);

      expect(mockedInitWebinarContext).toHaveBeenCalledWith(live, 'en');

      cleanup();
    }
  });

  it('polls for live manifest if the live is not already started', async () => {
    useLiveStateStarted.setState({
      isStarted: false,
    });
    const video = videoMockFactory({
      urls: {
        manifests: {
          hls: 'some hls',
        },
        mp4: {},
        thumbnails: {},
      },
    });
    const live: Live = {
      ...video,
      live_state: liveState.RUNNING,
    };

    const deferred = new Deferred<null>();
    mockedPollForLive.mockReturnValue(deferred.promise);

    const { rerender } = render(
      wrapInIntlProvider(
        <PublicLiveDashboard live={live} playerType={'videojs'} />,
      ),
    );

    await waitFor(() => expect(mockedPollForLive).toBeCalled());
    expect(useLiveStateStarted.getState().isStarted).toEqual(false);

    act(() => deferred.resolve(null));
    await waitFor(() =>
      expect(useLiveStateStarted.getState().isStarted).toEqual(true),
    );

    const liveStates = Object.values(liveState);
    for (const state of liveStates) {
      if (state === liveState.ENDED) {
        //  not valid for a running live
        return;
      }

      if (state === liveState.RUNNING) {
        //  test case
        return;
      }

      const updatedLive: Live = { ...live, live_state: state };

      rerender(
        wrapInIntlProvider(
          <PublicLiveDashboard live={updatedLive} playerType={'videojs'} />,
        ),
      );

      await waitFor(() =>
        expect(useLiveStateStarted.getState().isStarted).toEqual(false),
      );
    }
  });

  it('redirects to dashboard if user has right and live is stopping or stopped', async () => {
    mockedGetDecodedJwt.mockReturnValue({
      locale: 'en',
      maintenance: false,
      resource_id: 'id',
      permissions: { can_update: true, can_access_dashboard: false },
      roles: [],
      session_id: 'session-id',
    });

    const values: (liveState.STOPPING | liveState.STOPPED)[] = [
      liveState.STOPPING,
      liveState.STOPPED,
    ];

    for (const state of values) {
      const video = videoMockFactory();
      const live: Live = { ...video, live_state: state };

      render(
        wrapInIntlProvider(
          wrapInRouter(
            <PublicLiveDashboard live={live} playerType="someplayer" />,
            [
              {
                path: DASHBOARD_ROUTE(modelName.VIDEOS),
                render: () => <div>teacher dasboard</div>,
              },
            ],
          ),
        ),
      );

      await screen.findByText('teacher dasboard');

      cleanup();
    }
  });

  it('displays end of live for non scheduled live', async () => {
    const values: (
      | liveState.STOPPING
      | liveState.STOPPED
      | liveState.HARVESTING
      | liveState.HARVESTED
    )[] = [
      liveState.STOPPING,
      liveState.STOPPED,
      liveState.HARVESTING,
      liveState.HARVESTED,
    ];

    for (const state of values) {
      const video = videoMockFactory();
      const live: Live = { ...video, live_state: state };

      render(
        wrapInIntlProvider(
          <PublicLiveDashboard live={live} playerType="someplayer" />,
        ),
      );

      await screen.findByText(/This live has ended/);

      cleanup();
    }
  });

  it('displays end of live for passed scheduled live', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2022, 1, 20, 14, 0, 0));

    const values: (
      | liveState.STOPPING
      | liveState.STOPPED
      | liveState.HARVESTING
      | liveState.HARVESTED
    )[] = [
      liveState.STOPPING,
      liveState.STOPPED,
      liveState.HARVESTING,
      liveState.HARVESTED,
    ];

    for (const state of values) {
      const video = videoMockFactory();
      const live: Live = {
        ...video,
        live_state: state,
        starting_at: new Date(2022, 1, 20, 10, 0, 0).toISOString(),
      };

      render(
        wrapInIntlProvider(
          <PublicLiveDashboard live={live} playerType="someplayer" />,
        ),
      );

      await screen.findByText(/This live has ended/);

      cleanup();
    }

    jest.useRealTimers();
  });

  it('displays advertising for non started non scheduled live', async () => {
    const values: (liveState.IDLE | liveState.STARTING)[] = [
      liveState.IDLE,
      liveState.STARTING,
    ];

    for (const state of values) {
      const video = videoMockFactory();
      const live: Live = {
        ...video,
        live_state: state,
      };

      render(
        wrapInIntlProvider(
          <PublicLiveDashboard live={live} playerType="someplayer" />,
        ),
      );

      await screen.findByText(/Live is starting/);

      cleanup();
    }
  });

  it('displays advertising for non-running scheduled future live', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2022, 1, 20, 14, 0, 0));

    const values: (
      | liveState.IDLE
      | liveState.STOPPING
      | liveState.STOPPED
      | liveState.HARVESTING
      | liveState.HARVESTED
    )[] = [
      liveState.IDLE,
      liveState.STOPPING,
      liveState.STOPPED,
      liveState.HARVESTING,
      liveState.HARVESTED,
    ];

    for (const state of values) {
      const video = videoMockFactory();
      const live: Live = {
        ...video,
        live_state: state,
        starting_at: new Date(2022, 1, 20, 15, 0, 0).toISOString(),
      };

      render(
        wrapInIntlProvider(
          <PublicLiveDashboard live={live} playerType="someplayer" />,
        ),
      );

      await screen.findByText(/Live will start in/);

      cleanup();
    }

    jest.useRealTimers();
  });

  it('displays advertising for starting scheduled future live', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2022, 1, 20, 14, 0, 0));

    const video = videoMockFactory();
    const live: Live = {
      ...video,
      live_state: liveState.STARTING,
      starting_at: new Date(2022, 1, 20, 15, 0, 0).toISOString(),
    };

    render(
      wrapInIntlProvider(
        <PublicLiveDashboard live={live} playerType="someplayer" />,
      ),
    );

    await screen.findByText(/Live is starting/);

    jest.useRealTimers();
  });

  it('displays the player once manifest is pulled for non scheduled live', async () => {
    const video = videoMockFactory();
    const live: Live = {
      ...video,
      live_state: liveState.RUNNING,
    };
    const deferred = new Deferred<null>();
    mockedPollForLive.mockReturnValue(deferred.promise);

    render(
      wrapInIntlProvider(
        <PublicLiveDashboard live={live} playerType="someplayer" />,
      ),
    );

    await screen.findByText(/Live is starting/);

    deferred.resolve(null);

    await screen.findByText('live wrapper');
    expect(mockedStudentLiveWrapper).toHaveBeenCalledWith(
      {
        video: live,
        playerType: 'someplayer',
      },
      {},
    );
  });

  it('displays the player once manifest is pulled for scheduled future live', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2022, 1, 20, 14, 0, 0));

    const video = videoMockFactory();
    const live: Live = {
      ...video,
      live_state: liveState.RUNNING,
      starting_at: new Date(2022, 1, 20, 15, 0, 0).toISOString(),
    };
    const deferred = new Deferred<null>();
    mockedPollForLive.mockReturnValue(deferred.promise);

    render(
      wrapInIntlProvider(
        <PublicLiveDashboard live={live} playerType="someplayer" />,
      ),
    );

    await screen.findByText(/Live is starting/);

    deferred.resolve(null);

    await screen.findByText('live wrapper');
    expect(mockedStudentLiveWrapper).toHaveBeenCalledWith(
      {
        video: live,
        playerType: 'someplayer',
      },
      {},
    );

    jest.useRealTimers();
  });

  it('displays the player once manifest is pulled for scheduled past live', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2022, 1, 20, 14, 0, 0));

    const video = videoMockFactory();
    const live: Live = {
      ...video,
      live_state: liveState.RUNNING,
      starting_at: new Date(2022, 1, 20, 13, 0, 0).toISOString(),
    };
    const deferred = new Deferred<null>();
    mockedPollForLive.mockReturnValue(deferred.promise);

    render(
      wrapInIntlProvider(
        <PublicLiveDashboard live={live} playerType="someplayer" />,
      ),
    );

    await screen.findByText(/Live is starting/);

    deferred.resolve(null);

    await screen.findByText('live wrapper');
    expect(mockedStudentLiveWrapper).toHaveBeenCalledWith(
      {
        video: live,
        playerType: 'someplayer',
      },
      {},
    );

    jest.useRealTimers();
  });

  it('displays advertising for non started non scheduled live and join mode is forced', async () => {
    const values: (liveState.IDLE | liveState.STARTING)[] = [
      liveState.IDLE,
      liveState.STARTING,
    ];

    for (const state of values) {
      const video = videoMockFactory();
      const live: Live = {
        ...video,
        live_state: state,
        join_mode: JoinMode.FORCED,
      };

      render(
        wrapInIntlProvider(
          <PublicLiveDashboard live={live} playerType="someplayer" />,
        ),
      );

      await screen.findByText(/Live is starting/);
      expect(useParticipantWorkflow.getState().accepted).toBe(false);
      expect(mockedStudentLiveWrapper).not.toBeCalled();

      cleanup();
    }
  });

  it('displays the player once manifest is pulled and put the user on stage when join mode is forced', async () => {
    const video = videoMockFactory();
    const live: Live = {
      ...video,
      live_state: liveState.RUNNING,
      join_mode: JoinMode.FORCED,
    };
    const deferred = new Deferred<null>();
    mockedPollForLive.mockReturnValue(deferred.promise);

    render(
      wrapInIntlProvider(
        <PublicLiveDashboard live={live} playerType="someplayer" />,
      ),
    );
    await screen.findByText(/Live is starting/);

    deferred.resolve(null);

    await screen.findByText('live wrapper');
    expect(useParticipantWorkflow.getState().accepted).toBe(true);
    expect(mockedStudentLiveWrapper).toHaveBeenCalledWith(
      {
        video: live,
        playerType: 'someplayer',
      },
      {},
    );
  });
});

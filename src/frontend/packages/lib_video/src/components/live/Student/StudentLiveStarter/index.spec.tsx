import { act, cleanup, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Nullable } from 'lib-common';
import {
  useCurrentResourceContext,
  useJwt,
  JoinMode,
  Live,
  liveState,
  liveSessionFactory,
  videoMockFactory,
  LiveModeType,
} from 'lib-components';
import { render, Deferred } from 'lib-tests';
import React from 'react';

import { pollForLive } from 'api/pollForLive';
import { setLiveSessionDisplayName } from 'api/setLiveSessionDisplayName';
import { useLiveStateStarted } from 'hooks/useLiveStateStarted';
import { useParticipantWorkflow } from 'hooks/useParticipantWorkflow';
import { converse } from 'utils/window';
import { wrapInVideo } from 'utils/wrapInVideo';

import { StudentLiveWrapper } from './StudentLiveWrapper';

import { StudentLiveStarter } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
  useCurrentResourceContext: jest.fn(),
  decodeJwt: () => ({}),
}));

jest.mock('api/pollForLive', () => ({
  pollForLive: jest.fn(),
}));
const mockedPollForLive = pollForLive as jest.MockedFunction<
  typeof pollForLive
>;

jest.mock('./StudentLiveWrapper', () => ({
  StudentLiveWrapper: jest.fn().mockImplementation(() => <p>live wrapper</p>),
}));
const mockedStudentLiveWrapper = StudentLiveWrapper as jest.MockedFunction<
  typeof StudentLiveWrapper
>;

jest.mock('components/live/common/ConverseInitializer', () => ({
  ConverseInitializer: ({ children }: { children: React.ReactNode }) => {
    return children;
  },
}));

jest.mock('utils/window', () => ({
  converse: {
    acceptParticipantToJoin: jest.fn(),
    askParticipantToJoin: jest.fn(),
    claimNewNicknameInChatRoom: jest.fn(),
  },
}));

jest.mock('api/setLiveSessionDisplayName', () => ({
  setLiveSessionDisplayName: jest.fn(),
}));

const mockConverse = converse.claimNewNicknameInChatRoom as jest.MockedFunction<
  typeof converse.claimNewNicknameInChatRoom
>;
const mockSetLiveSessionDisplayName =
  setLiveSessionDisplayName as jest.MockedFunction<
    typeof setLiveSessionDisplayName
  >;

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('StudentLiveStarter', () => {
  beforeEach(() => {
    useJwt.setState({ jwt: 'some token' });
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        resource_id: 'id',
        permissions: { can_update: false, can_access_dashboard: false },
        roles: [],
        session_id: 'session-id',
      },
    ] as any);
  });
  afterEach(() => {
    jest.clearAllMocks();
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
      live_type: LiveModeType.JITSI,
    };

    const deferred = new Deferred<null>();
    mockedPollForLive.mockReturnValue(deferred.promise);

    const { rerender } = render(
      wrapInVideo(<StudentLiveStarter playerType="videojs" />, live),
    );

    await waitFor(() => expect(mockedPollForLive).toHaveBeenCalled());
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
        wrapInVideo(<StudentLiveStarter playerType="videojs" />, updatedLive),
      );

      await waitFor(() =>
        expect(useLiveStateStarted.getState().isStarted).toEqual(false),
      );
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
      const live: Live = {
        ...video,
        live_state: state,
        live_type: LiveModeType.JITSI,
      };

      render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

      expect(await screen.findByText(/Live is starting/)).toBeInTheDocument();

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
        live_type: LiveModeType.JITSI,
        starting_at: new Date(2022, 1, 20, 10, 0, 0).toISOString(),
      };

      render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

      expect(
        await screen.findByText(/This live has ended/),
      ).toBeInTheDocument();

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
        live_type: LiveModeType.JITSI,
      };

      render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

      expect(await screen.findByText(/Live is starting/)).toBeInTheDocument();

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
        live_type: LiveModeType.JITSI,
        starting_at: new Date(2022, 1, 20, 15, 0, 0).toISOString(),
      };

      render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

      expect(await screen.findByText(/Live will start in/)).toBeInTheDocument();

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
      live_type: LiveModeType.JITSI,
      starting_at: new Date(2022, 1, 20, 15, 0, 0).toISOString(),
    };

    render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

    expect(await screen.findByText(/Live is starting/)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('displays the player once manifest is pulled for non scheduled live', async () => {
    const video = videoMockFactory();
    const live: Live = {
      ...video,
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    };
    const deferred = new Deferred<null>();
    mockedPollForLive.mockReturnValue(deferred.promise);

    render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

    await screen.findByText(/Live is starting/);

    deferred.resolve(null);

    await screen.findByText('live wrapper');
    expect(mockedStudentLiveWrapper).toHaveBeenCalledWith(
      {
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
      live_type: LiveModeType.JITSI,
      starting_at: new Date(2022, 1, 20, 15, 0, 0).toISOString(),
    };
    const deferred = new Deferred<null>();
    mockedPollForLive.mockReturnValue(deferred.promise);

    render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

    await screen.findByText(/Live is starting/);

    deferred.resolve(null);

    await screen.findByText('live wrapper');
    expect(mockedStudentLiveWrapper).toHaveBeenCalledWith(
      {
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
      live_type: LiveModeType.JITSI,
      starting_at: new Date(2022, 1, 20, 13, 0, 0).toISOString(),
    };
    const deferred = new Deferred<null>();
    mockedPollForLive.mockReturnValue(deferred.promise);

    render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

    await screen.findByText(/Live is starting/);
    screen.getByText(
      /You can wait here, the page will be refreshed as soon as the event starts./,
    );

    deferred.resolve(null);

    await screen.findByText('live wrapper');
    expect(mockedStudentLiveWrapper).toHaveBeenCalledWith(
      {
        playerType: 'someplayer',
      },
      {},
    );

    jest.useRealTimers();
  });

  it('check title and descrition when scheduled past live and live state stopped', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2022, 1, 20, 14, 0, 0));

    const video = videoMockFactory();
    const live: Live = {
      ...video,
      live_state: liveState.STOPPED,
      live_type: LiveModeType.JITSI,
      starting_at: new Date(2022, 1, 20, 13, 0, 0).toISOString(),
    };

    render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

    await screen.findByText(/This live has ended/);
    screen.getByText(/You can wait here, the VOD will be available soon./);

    expect(mockedPollForLive).not.toHaveBeenCalled();

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
        live_type: LiveModeType.JITSI,
        join_mode: JoinMode.FORCED,
      };

      render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

      await screen.findByText(/Live is starting/);
      expect(useParticipantWorkflow.getState().accepted).toBe(false);
      expect(mockedStudentLiveWrapper).not.toHaveBeenCalled();

      cleanup();
    }
  });

  it('displays the player without manifest pull and put the user on stage when join mode is forced', async () => {
    mockConverse.mockImplementation(
      (
        _displayName: string,
        callbackSuccess: () => void,
        _callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        callbackSuccess();
      },
    );
    useLiveStateStarted.setState({
      isStarted: false,
    });

    const video = videoMockFactory();
    const live: Live = {
      ...video,
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
      join_mode: JoinMode.FORCED,
    };
    mockSetLiveSessionDisplayName.mockResolvedValue({
      success: liveSessionFactory({ display_name: 'John_Doe' }),
    });

    render(wrapInVideo(<StudentLiveStarter playerType="someplayer" />, live));

    // waiting room
    await screen.findByText(/Live has started/);

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');

    userEvent.click(validateButton);

    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );

    expect(mockedPollForLive).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(useParticipantWorkflow.getState().asked).toBe(true),
    );

    // join accepted
    act(() => {
      useParticipantWorkflow.setState({ accepted: true });
    });

    await screen.findByText('live wrapper');
    expect(mockedStudentLiveWrapper).toHaveBeenCalledWith(
      {
        playerType: 'someplayer',
      },
      {},
    );
  });
});

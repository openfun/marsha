import { act, cleanup, waitFor } from '@testing-library/react';
import {
  DecodedJwt,
  LiveModeType,
  liveMockFactory,
  liveState,
  useJwt,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { JitsiApiProvider } from '@lib-video/hooks/useJitsiApi';
import { convertVideoToJitsiLive } from '@lib-video/utils/convertVideo';
import * as mockWindow from '@lib-video/utils/window';

import { initializeJitsi } from './utils';

import DashboardLiveJitsi from '.';

let events: any = {};
const dispatch = (eventName: string, eventObject: any) => {
  events[eventName](eventObject);
};

const mockExecuteCommand = jest.fn();
const mockDispose = jest.fn();
const mockAddListener = jest
  .fn()
  .mockImplementation((eventName: string, callback: (event: any) => void) => {
    events[eventName] = callback;
  });
const mockJitsi = {
  dispose: mockDispose,
  executeCommand: mockExecuteCommand,
  addListener: mockAddListener,
  removeListener: (eventName: string) => {
    delete events[eventName];
  },
};
jest.mock('./utils', () => ({
  initializeJitsi: jest.fn().mockImplementation(() => mockJitsi),
}));
const mockedInitialiseJitis = initializeJitsi as jest.MockedFunction<
  typeof initializeJitsi
>;

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

jest.mock('utils/window', () => ({
  converse: {
    participantLeaves: jest.fn(),
  },
}));

describe('<DashboardLiveJitsi />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          user: {
            id: '7f93178b-e578-44a6-8c85-ef267b6bf431',
            username: 'jane_doe',
          },
        }) as DecodedJwt,
    });

    events = {};
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('configures jitsi', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.IDLE,
    });

    const { rerender } = render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(mockedInitialiseJitis).toHaveBeenCalled());

    await waitFor(() => expect(events.participantRoleChanged).toBeDefined());

    // simulates moderator role granted
    act(() =>
      dispatch('participantRoleChanged', {
        role: 'moderator',
      }),
    );

    await waitFor(() =>
      expect(mockExecuteCommand).not.toHaveBeenCalledWith(
        'startRecording',
        expect.any(Object),
      ),
    );
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
    expect(events.recordingStatusChanged).toBeDefined();
    expect(events.participantRoleChanged).toBeDefined();
    expect(events.readyToClose).toBeDefined();
    expect(events.videoConferenceJoined).toBeDefined();

    // state switch to running, recording must start
    rerender(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={
            convertVideoToJitsiLive({
              ...video,
              live_state: liveState.RUNNING,
            })!
          }
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() =>
      expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
        mode: 'stream',
        rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
      }),
    );
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );

    // state switch to stopping, recording must stop
    rerender(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={
            convertVideoToJitsiLive({
              ...video,
              live_state: liveState.STOPPING,
            })!
          }
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() =>
      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'stopRecording',
        'stream',
      ),
    );

    expect(mockExecuteCommand).toHaveBeenCalledTimes(2);
  });

  it('configures jitsi without username', async () => {
    const decodedTokenWithoutUser = [
      {},
      {
        user: {
          id: '7f93178b-e578-44a6-8c85-ef267b6bf431',
        },
      },
    ];

    for (const decodedToken of decodedTokenWithoutUser) {
      useJwt.setState({
        getDecodedJwt: () => decodedToken as DecodedJwt,
      });
      const video = liveMockFactory({
        live_info: {
          medialive: {
            input: {
              endpoints: [
                'rtmp://1.2.3.4:1935/stream-key-primary',
                'rtmp://4.3.2.1:1935/stream-key-secondary',
              ],
            },
          },
          jitsi: {
            domain: 'meet.jit.si',
            external_api_url: 'https://meet.jit.si/external_api.js',
            config_overwrite: {},
            interface_config_overwrite: {},
            room_name: 'jitsi_conference',
          },
        },
        live_state: liveState.IDLE,
      });

      render(
        <JitsiApiProvider value={undefined}>
          <DashboardLiveJitsi
            liveJitsi={convertVideoToJitsiLive(video)!}
            setCanStartLive={jest.fn()}
            setCanShowStartButton={jest.fn()}
            isInstructor={true}
          />
        </JitsiApiProvider>,
      );

      await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

      cleanup();
      jest.clearAllMocks();
    }
  });

  it('configures jitsi with a JWT', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
          token: 'jitsi_jwt_token',
        },
      },
      live_state: liveState.IDLE,
    });

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(mockedInitialiseJitis).toHaveBeenCalled());
  });

  it('manages recording interruption', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
          token: 'some token',
        },
      },
      live_state: liveState.RUNNING,
    });

    const setCanShowStartButton = jest.fn();
    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={setCanShowStartButton}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    await waitFor(() => {
      expect(events.participantRoleChanged).toBeDefined();
    });

    // simulates moderator role granted
    act(() =>
      dispatch('participantRoleChanged', {
        role: 'moderator',
      }),
    );

    await waitFor(() => expect(events.recordingStatusChanged).toBeDefined());

    await waitFor(() => {
      expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
        mode: 'stream',
        rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
      });
    });
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
    expect(mockExecuteCommand).toHaveBeenCalledTimes(1);

    // simulates recording interruption
    act(() => {
      dispatch('recordingStatusChanged', {
        on: false,
        mode: 'stream',
        error: 'service unavailable',
      });

      jest.advanceTimersToNextTimer();
    });

    await waitFor(() => {
      expect(mockExecuteCommand).toHaveBeenCalledTimes(2);
    });
    expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
      mode: 'stream',
      rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
    });
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
  });

  it('manages triggering start recording multiple times by multiple moderators', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    await waitFor(() => {
      expect(events.participantRoleChanged).toBeDefined();
    });

    // simulates moderator role granted
    act(() =>
      dispatch('participantRoleChanged', {
        role: 'moderator',
      }),
    );

    await waitFor(() => expect(events.recordingStatusChanged).toBeDefined());

    await waitFor(() => {
      expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
        mode: 'stream',
        rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
      });
    });
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
    expect(mockExecuteCommand).toHaveBeenCalledTimes(1);

    // simulates recording interruption
    act(() => {
      dispatch('recordingStatusChanged', {
        on: false,
        mode: 'stream',
        error: 'unexpected-request',
      });

      jest.advanceTimersToNextTimer();
    });

    await waitFor(() => expect(mockExecuteCommand).toHaveBeenCalledTimes(1));
  });

  it('calls setCanStartLive when role changes', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });
    const mockCanStartLive = jest.fn();

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={mockCanStartLive}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    await waitFor(() => expect(mockCanStartLive).toHaveBeenCalledTimes(1));
    expect(mockCanStartLive).toHaveBeenCalledWith(false);

    // simulates moderator role granted
    act(() =>
      dispatch('participantRoleChanged', {
        role: 'moderator',
      }),
    );

    await waitFor(() => expect(mockCanStartLive).toHaveBeenCalledTimes(2));
    expect(mockCanStartLive).toHaveBeenNthCalledWith(2, true);

    // simulates user is no longer moderator
    act(() =>
      dispatch('participantRoleChanged', {
        role: 'participant',
      }),
    );

    await waitFor(() => expect(mockCanStartLive).toHaveBeenCalledTimes(3));
    expect(mockCanStartLive).toHaveBeenLastCalledWith(false);
  });

  it('calls setCanStartLive and setCanShowStartButton when participant leave the conference', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });
    const mockCanStartLive = jest.fn();
    const mockCanShowStartButton = jest.fn();

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={mockCanStartLive}
          setCanShowStartButton={mockCanShowStartButton}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalledTimes(1));

    expect(mockCanStartLive).toHaveBeenCalledTimes(1);
    expect(mockCanShowStartButton).not.toHaveBeenCalled();

    // simulates user leave the conference
    act(() => dispatch('readyToClose', {}));

    await waitFor(() =>
      expect(mockCanStartLive).toHaveBeenLastCalledWith(false),
    );
    expect(mockCanShowStartButton).toHaveBeenLastCalledWith(false);
    expect(mockDispose).toHaveBeenCalled();

    expect(initializeJitsi).toHaveBeenCalledTimes(2);
  });

  it('calls setCanShowStartButton when participant join the conference', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });
    const mockCanShowStartButton = jest.fn();

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={mockCanShowStartButton}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    await waitFor(() => expect(events.videoConferenceJoined).toBeDefined());

    expect(mockCanShowStartButton).not.toHaveBeenCalled();

    // simulates user leave the conference
    act(() => dispatch('videoConferenceJoined', {}));

    await waitFor(() =>
      expect(mockCanShowStartButton).toHaveBeenLastCalledWith(true),
    );
  });

  it('does not start recording when isInstructor is False', async () => {
    const video = liveMockFactory({
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          isInstructor={false}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'startRecording',
      expect.any(Object),
    );
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
  });

  it('does not start recording when the user is an instructor but not a moderator', async () => {
    const video = liveMockFactory({
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          isInstructor={true}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'startRecording',
      expect.any(Object),
    );
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
  });

  it('redirects to the player when user leaves the conference and is not an instructor', async () => {
    const video = liveMockFactory({
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          isInstructor={false}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    await waitFor(() => {
      expect(events.readyToClose).toBeDefined();
    });

    expect(mockWindow.converse.participantLeaves).not.toHaveBeenCalled();
    // simulates user leave the conference
    act(() => dispatch('readyToClose', {}));

    await waitFor(() =>
      expect(mockWindow.converse.participantLeaves).toHaveBeenCalled(),
    );
  });

  it('allows to restart a streaming once stopped without error', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });

    const { rerender } = render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    await waitFor(() => {
      expect(events.participantRoleChanged).toBeDefined();
    });

    // simulates moderator role granted
    act(() =>
      dispatch('participantRoleChanged', {
        role: 'moderator',
      }),
    );

    await waitFor(() => expect(events.recordingStatusChanged).toBeDefined());

    await waitFor(() => {
      expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
        mode: 'stream',
        rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
      });
    });
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
    expect(mockExecuteCommand).toHaveBeenCalledTimes(1);

    // stop streaming
    rerender(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={
            convertVideoToJitsiLive({
              ...video,
              live_state: liveState.STOPPING,
            })!
          }
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() =>
      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'stopRecording',
        expect.any(String),
      ),
    );
    expect(mockExecuteCommand).toHaveBeenCalledTimes(2);
    // simulates recording interruption without error
    act(() =>
      dispatch('recordingStatusChanged', {
        on: false,
        mode: 'stream',
      }),
    );

    // resume streaming
    rerender(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={
            convertVideoToJitsiLive({
              ...video,
              live_state: liveState.RUNNING,
            })!
          }
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => {
      expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
        mode: 'stream',
        rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
      });
    });
    expect(mockExecuteCommand).toHaveBeenCalledTimes(3);
  });

  it('stop retrying to start streaming when the error is not-allowed', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    await waitFor(() => {
      expect(events.participantRoleChanged).toBeDefined();
    });

    // simulates moderator role granted
    act(() =>
      dispatch('participantRoleChanged', {
        role: 'moderator',
      }),
    );

    await waitFor(() => expect(events.recordingStatusChanged).toBeDefined());

    await waitFor(() => {
      expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
        mode: 'stream',
        rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
      });
    });
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
    expect(mockExecuteCommand).toHaveBeenCalledTimes(1);

    // simulates recording interruption
    act(() =>
      dispatch('recordingStatusChanged', {
        on: false,
        mode: 'stream',
        error: 'not-allowed',
      }),
    );

    jest.advanceTimersToNextTimer();

    await waitFor(() => expect(mockExecuteCommand).toHaveBeenCalledTimes(1));
  });

  it('does not start streaming when loading the component and jitsi already streaming', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    await waitFor(() => {
      expect(events.participantRoleChanged).toBeDefined();
    });

    // simulates moderator role granted
    act(() => {
      dispatch('participantRoleChanged', {
        role: 'moderator',
      });

      // simulates recording already on
      dispatch('recordingStatusChanged', {
        on: true,
        mode: 'stream',
      });
    });

    await waitFor(() =>
      expect(mockExecuteCommand).not.toHaveBeenCalledWith(
        'startRecording',
        expect.any(String),
      ),
    );
  });

  it('start streaming when the component is loaded and the live_state already running', async () => {
    const video = liveMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
    });

    render(
      <JitsiApiProvider value={undefined}>
        <DashboardLiveJitsi
          liveJitsi={convertVideoToJitsiLive(video)!}
          setCanStartLive={jest.fn()}
          setCanShowStartButton={jest.fn()}
          isInstructor={true}
        />
      </JitsiApiProvider>,
    );

    await waitFor(() => expect(initializeJitsi).toHaveBeenCalled());

    await waitFor(() =>
      expect(mockExecuteCommand).not.toHaveBeenCalledWith(
        'startRecording',
        expect.any(String),
      ),
    );

    // simulates moderator role granted
    act(() =>
      dispatch('participantRoleChanged', {
        role: 'moderator',
      }),
    );

    await waitFor(() => {
      expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
        mode: 'stream',
        rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
      });
    });
  });
});

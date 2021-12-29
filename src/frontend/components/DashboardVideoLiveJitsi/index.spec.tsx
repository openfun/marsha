import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { PLAYER_ROUTE } from 'components/routes';
import { modelName } from 'types/models';
import { LiveModeType, liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import * as mockWindow from 'utils/window';
import DashboardVideoLiveJitsi from '.';

let events: any = {};
const dispatch = (eventName: string, eventObject: any) => {
  events[eventName](eventObject);
};

const mockExecuteCommand = jest.fn();
const mockDispose = jest.fn();
const mockJitsi = jest.fn().mockImplementation(() => ({
  dispose: mockDispose,
  executeCommand: mockExecuteCommand,
  addListener: (eventName: string, callback: (event: any) => void) => {
    events[eventName] = callback;
  },
}));
jest.mock('utils/errors/report', () => ({ report: jest.fn() }));
jest.mock('utils/window', () => ({
  converse: {
    participantLeaves: jest.fn(),
  },
}));
let mockDecodedJwtToken = {};
jest.mock('data/appData', () => ({
  getDecodedJwt: () => mockDecodedJwtToken,
}));

describe('<DashboardVideoLiveJitsi />', () => {
  beforeEach(() => {
    mockDecodedJwtToken = {
      user: {
        id: '7f93178b-e578-44a6-8c85-ef267b6bf431',
        username: 'jane_doe',
      },
    };
    events = {};
    jest.clearAllMocks();
    jest.useFakeTimers('modern');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('configures jitsi', () => {
    const video = videoMockFactory({
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
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });
    global.JitsiMeetExternalAPI = mockJitsi;

    const { rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={video}
            setCanStartLive={jest.fn()}
            setCanShowStartButton={jest.fn()}
            isInstructor={true}
          />,
        ),
      ),
    );
    const toolbarButtons = [
      'microphone',
      'camera',
      'closedcaptions',
      'desktop',
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'profile',
      'settings',
      'raisehand',
      'videoquality',
      'filmstrip',
      'feedback',
      'shortcuts',
      'tileview',
      'select-background',
      'help',
      'mute-everyone',
      'mute-video-everyone',
      'security',
    ];
    expect(mockJitsi).toHaveBeenCalledWith('meet.jit.si', {
      configOverwrite: {
        constraints: {
          video: {
            height: {
              ideal: 720,
              max: 720,
              min: 240,
            },
          },
        },
        conferenceInfo: {
          alwaysVisible: ['recording'],

          autoHide: [],
        },
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      parentNode: expect.any(HTMLElement),
      roomName: video.id,
      userInfo: {
        displayName: 'jane_doe',
      },
    });

    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'startRecording',
      expect.any({}),
    );
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
    expect(events.recordingStatusChanged).toBeDefined();
    expect(events.participantRoleChanged).toBeDefined();
    expect(events.videoConferenceLeft).toBeDefined();
    expect(events.videoConferenceJoined).toBeDefined();

    // state switch to running, recording must start
    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={{ ...video, live_state: liveState.RUNNING }}
            setCanStartLive={jest.fn()}
            setCanShowStartButton={jest.fn()}
            isInstructor={true}
          />,
        ),
      ),
    );

    expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
      mode: 'stream',
      rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
    });
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );

    // state switch to stopping, recording must stop
    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={{ ...video, live_state: liveState.STOPPING }}
            setCanStartLive={jest.fn()}
            setCanShowStartButton={jest.fn()}
            isInstructor={true}
          />,
        ),
      ),
    );

    expect(mockExecuteCommand).toHaveBeenCalledWith('stopRecording', 'stream');

    expect(mockExecuteCommand).toHaveBeenCalledTimes(2);
  });

  it('configures jitsi without username', () => {
    const decodedTokenWithoutUser = [
      {},
      {
        user: {
          id: '7f93178b-e578-44a6-8c85-ef267b6bf431',
        },
      },
    ];

    decodedTokenWithoutUser.forEach((decodedToken) => {
      mockDecodedJwtToken = decodedToken;
      const video = videoMockFactory({
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
          },
        },
        live_state: liveState.IDLE,
        live_type: LiveModeType.JITSI,
      });
      global.JitsiMeetExternalAPI = mockJitsi;

      render(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardVideoLiveJitsi
              video={video}
              setCanStartLive={jest.fn()}
              setCanShowStartButton={jest.fn()}
              isInstructor={true}
            />,
          ),
        ),
      );
      const toolbarButtons = [
        'microphone',
        'camera',
        'closedcaptions',
        'desktop',
        'fullscreen',
        'fodeviceselection',
        'hangup',
        'profile',
        'settings',
        'raisehand',
        'videoquality',
        'filmstrip',
        'feedback',
        'shortcuts',
        'tileview',
        'select-background',
        'help',
        'mute-everyone',
        'mute-video-everyone',
        'security',
      ];
      expect(mockJitsi).toHaveBeenCalledWith('meet.jit.si', {
        configOverwrite: {
          constraints: {
            video: {
              height: {
                ideal: 720,
                max: 720,
                min: 240,
              },
            },
          },
          conferenceInfo: {
            alwaysVisible: ['recording'],

            autoHide: [],
          },
          disablePolls: true,
          doNotStoreRoom: true,
          hideConferenceSubject: true,
          hideConferenceTimer: true,
          resolution: 720,
          toolbarButtons,
        },
        interfaceConfigOverwrite: {
          HIDE_INVITE_MORE_HEADER: true,
          TOOLBAR_BUTTONS: toolbarButtons,
        },
        parentNode: expect.any(HTMLElement),
        roomName: video.id,
        userInfo: {
          displayName: undefined,
        },
      });
      cleanup();
      jest.clearAllMocks();
    });
  });

  it('manages recording interruption', async () => {
    const video = videoMockFactory({
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
        },
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });
    global.JitsiMeetExternalAPI = mockJitsi;

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={video}
            setCanStartLive={jest.fn()}
            setCanShowStartButton={jest.fn()}
            isInstructor={true}
          />,
        ),
      ),
    );

    expect(events.recordingStatusChanged).toBeDefined();

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
    dispatch('recordingStatusChanged', {
      on: false,
      mode: 'stream',
      error: 'service unavailable',
    });

    jest.advanceTimersToNextTimer();

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

  it('calls setCanStartLive when role changes', () => {
    const video = videoMockFactory({
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
        },
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });
    global.JitsiMeetExternalAPI = mockJitsi;
    const mockCanStartLive = jest.fn();

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={video}
            setCanStartLive={mockCanStartLive}
            setCanShowStartButton={jest.fn()}
            isInstructor={true}
          />,
        ),
      ),
    );

    expect(mockCanStartLive).not.toHaveBeenCalled();

    // simulates moderator role granted
    dispatch('participantRoleChanged', {
      role: 'moderator',
    });

    expect(mockCanStartLive).toHaveBeenLastCalledWith(true);

    // simulates user is no longer moderator
    dispatch('participantRoleChanged', {
      role: 'participant',
    });

    expect(mockCanStartLive).toHaveBeenLastCalledWith(false);
  });

  it('calls setCanStartLive and setCanShowStartButton when participant leave the conference', () => {
    const video = videoMockFactory({
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
        },
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });
    global.JitsiMeetExternalAPI = mockJitsi;
    const mockCanStartLive = jest.fn();
    const mockCanShowStartButton = jest.fn();

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={video}
            setCanStartLive={mockCanStartLive}
            setCanShowStartButton={mockCanShowStartButton}
            isInstructor={true}
          />,
        ),
      ),
    );
    const toolbarButtons = [
      'microphone',
      'camera',
      'closedcaptions',
      'desktop',
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'profile',
      'settings',
      'raisehand',
      'videoquality',
      'filmstrip',
      'feedback',
      'shortcuts',
      'tileview',
      'select-background',
      'help',
      'mute-everyone',
      'mute-video-everyone',
      'security',
    ];
    expect(mockJitsi).toHaveBeenCalledWith('meet.jit.si', {
      configOverwrite: {
        constraints: {
          video: {
            height: {
              ideal: 720,
              max: 720,
              min: 240,
            },
          },
        },
        conferenceInfo: {
          alwaysVisible: ['recording'],

          autoHide: [],
        },
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      parentNode: expect.any(HTMLElement),
      roomName: video.id,
      userInfo: {
        displayName: 'jane_doe',
      },
    });

    expect(mockCanStartLive).not.toHaveBeenCalled();
    expect(mockCanShowStartButton).not.toHaveBeenCalled();
    expect(mockJitsi).toHaveBeenCalledTimes(1);

    // simulates user leave the conference
    dispatch('videoConferenceLeft', {});

    expect(mockCanStartLive).toHaveBeenLastCalledWith(false);
    expect(mockCanShowStartButton).toHaveBeenLastCalledWith(false);
    expect(mockDispose).toHaveBeenCalled();

    expect(mockJitsi).toHaveBeenCalledWith('meet.jit.si', {
      configOverwrite: {
        constraints: {
          video: {
            height: {
              ideal: 720,
              max: 720,
              min: 240,
            },
          },
        },
        conferenceInfo: {
          alwaysVisible: ['recording'],

          autoHide: [],
        },
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        prejoinPageEnabled: true,
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      parentNode: expect.any(HTMLElement),
      roomName: video.id,
      userInfo: {
        displayName: 'jane_doe',
      },
    });

    expect(mockJitsi).toHaveBeenCalledTimes(2);
  });

  it('calls setCanShowStartButton when participant join the conference', () => {
    const video = videoMockFactory({
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
        },
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });
    global.JitsiMeetExternalAPI = mockJitsi;
    const mockCanShowStartButton = jest.fn();

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={video}
            setCanStartLive={jest.fn()}
            setCanShowStartButton={mockCanShowStartButton}
            isInstructor={true}
          />,
        ),
      ),
    );

    expect(mockCanShowStartButton).not.toHaveBeenCalled();

    // simulates user leave the conference
    dispatch('videoConferenceJoined', {});

    expect(mockCanShowStartButton).toHaveBeenLastCalledWith(true);
  });

  it('does not start recording when isInstructor is False', () => {
    const video = videoMockFactory({
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
        },
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });
    global.JitsiMeetExternalAPI = mockJitsi;

    render(
      wrapInRouter(
        <DashboardVideoLiveJitsi video={video} isInstructor={false} />,
      ),
    );

    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'startRecording',
      expect.any({}),
    );
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
  });
  it('redirects to the player when user leaves the conference and is not an instructor', async () => {
    const video = videoMockFactory({
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
        },
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });
    global.JitsiMeetExternalAPI = mockJitsi;

    render(
      wrapInRouter(
        <DashboardVideoLiveJitsi video={video} isInstructor={false} />,
        [
          {
            path: PLAYER_ROUTE(modelName.VIDEOS),
            element: <span>{'video player'}</span>,
          },
        ],
      ),
    );

    act(() => {
      // simulates user leave the conference
      dispatch('videoConferenceLeft', {});
    });

    expect(mockDispose).toHaveBeenCalled();
    expect(mockWindow.converse.participantLeaves).toHaveBeenCalled();
    await screen.findByText('video player');
  });

  it('allows to restart a streaming once stopped without error', async () => {
    const video = videoMockFactory({
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
        },
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });
    global.JitsiMeetExternalAPI = mockJitsi;

    const { rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={video}
            setCanStartLive={jest.fn()}
            setCanShowStartButton={jest.fn()}
            isInstructor={true}
          />,
        ),
      ),
    );

    expect(events.recordingStatusChanged).toBeDefined();

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
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={{
              ...video,
              live_state: liveState.STOPPING,
            }}
            setCanStartLive={jest.fn()}
            setCanShowStartButton={jest.fn()}
            isInstructor={true}
          />,
        ),
      ),
    );
    expect(mockExecuteCommand).toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );
    expect(mockExecuteCommand).toHaveBeenCalledTimes(2);
    // simulates recording interruption without error
    dispatch('recordingStatusChanged', {
      on: false,
      mode: 'stream',
    });

    // resume streaming
    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveJitsi
            video={{
              ...video,
              live_state: liveState.RUNNING,
            }}
            setCanStartLive={jest.fn()}
            setCanShowStartButton={jest.fn()}
            isInstructor={true}
          />,
        ),
      ),
    );
    await waitFor(() => {
      expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
        mode: 'stream',
        rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
      });
    });
    expect(mockExecuteCommand).toHaveBeenCalledTimes(3);
  });
});

import {
  useCurrentUser,
  JoinMode,
  LiveModeType,
  liveState,
  liveMockFactory,
} from 'lib-components';

import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { convertVideoToJitsiLive } from '@lib-video/utils/convertVideo';

import { initializeJitsi } from './utils';

const node = jest.fn() as unknown as HTMLDivElement;

const mockJitsi = jest.fn();

describe('DashboardLiveJitsi/utils', () => {
  beforeEach(() => {
    global.JitsiMeetExternalAPI = mockJitsi;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('inits jitsi for students', () => {
    const video = liveMockFactory({
      live_type: LiveModeType.JITSI,
      live_info: {
        jitsi: {
          external_api_url: 'external api url',
          domain: 'domain',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'room name',
        },
      },
      live_state: liveState.RUNNING,
    });

    initializeJitsi(convertVideoToJitsiLive(video)!, false, node);

    const toolbarButtons = [
      'camera',
      'closedcaptions',
      'desktop',
      'feedback',
      'filmstrip',
      'fullscreen',
      'fodeviceselection',
      'help',
      'microphone',
      'mute-everyone',
      'mute-video-everyone',
      'participants-pane',
      'profile',
      'raisehand',
      'security',
      'select-background',
      'settings',
      'sharedvideo',
      'shortcuts',
      'tileview',
      'videoquality',
    ];

    expect(mockJitsi).toHaveBeenCalledTimes(1);
    expect(mockJitsi).toHaveBeenCalledWith('domain', {
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
        disableDeepLinking: true,
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        prejoinConfig: {
          enabled: false,
        },
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      jwt: undefined,
      parentNode: node,
      roomName: 'room name',
      userInfo: {
        displayName: undefined,
      },
    });
  });

  it('overrides configuration', () => {
    const video = liveMockFactory({
      live_type: LiveModeType.JITSI,
      live_info: {
        jitsi: {
          external_api_url: 'external api url',
          domain: 'domain',
          config_overwrite: {
            disableDeepLinking: false,
          },
          interface_config_overwrite: {},
          room_name: 'room name',
        },
      },
      live_state: liveState.RUNNING,
    });

    initializeJitsi(convertVideoToJitsiLive(video)!, false, node);

    const toolbarButtons = [
      'camera',
      'closedcaptions',
      'desktop',
      'feedback',
      'filmstrip',
      'fullscreen',
      'fodeviceselection',
      'help',
      'microphone',
      'mute-everyone',
      'mute-video-everyone',
      'participants-pane',
      'profile',
      'raisehand',
      'security',
      'select-background',
      'settings',
      'sharedvideo',
      'shortcuts',
      'tileview',
      'videoquality',
    ];

    expect(mockJitsi).toHaveBeenCalledTimes(1);
    expect(mockJitsi).toHaveBeenCalledWith('domain', {
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
        disableDeepLinking: false,
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        prejoinConfig: {
          enabled: false,
        },
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      jwt: undefined,
      parentNode: node,
      roomName: 'room name',
      userInfo: {
        displayName: undefined,
      },
    });
  });

  it('overrides interface configuration', () => {
    const video = liveMockFactory({
      live_type: LiveModeType.JITSI,
      live_info: {
        jitsi: {
          external_api_url: 'external api url',
          domain: 'domain',
          config_overwrite: {},
          interface_config_overwrite: {
            HIDE_INVITE_MORE_HEADER: false,
          },
          room_name: 'room name',
        },
      },
      live_state: liveState.RUNNING,
    });

    initializeJitsi(convertVideoToJitsiLive(video)!, false, node);

    const toolbarButtons = [
      'camera',
      'closedcaptions',
      'desktop',
      'feedback',
      'filmstrip',
      'fullscreen',
      'fodeviceselection',
      'help',
      'microphone',
      'mute-everyone',
      'mute-video-everyone',
      'participants-pane',
      'profile',
      'raisehand',
      'security',
      'select-background',
      'settings',
      'sharedvideo',
      'shortcuts',
      'tileview',
      'videoquality',
    ];

    expect(mockJitsi).toHaveBeenCalledTimes(1);
    expect(mockJitsi).toHaveBeenCalledWith('domain', {
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
        disableDeepLinking: true,
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        prejoinConfig: {
          enabled: false,
        },
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: false,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      jwt: undefined,
      parentNode: node,
      roomName: 'room name',
      userInfo: {
        displayName: undefined,
      },
    });
  });

  it('uses live session display name', () => {
    const video = liveMockFactory({
      live_type: LiveModeType.JITSI,
      live_info: {
        jitsi: {
          external_api_url: 'external api url',
          domain: 'domain',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'room name',
        },
      },
      live_state: liveState.RUNNING,
    });
    useLiveSession.setState({
      liveSession: {
        display_name: 'some display name',
        anonymous_id: 'anonymous id',
        consumer_site: 'consumer site',
        email: 'email',
        id: 'id',
        is_registered: false,
        language: 'en',
        live_attendance: null,
        lti_id: null,
        lti_user_id: null,
        should_send_reminders: false,
        username: 'user name',
        video: video.id,
      },
    });
    useCurrentUser.setState({
      currentUser: {
        username: 'user name',
      } as any,
    });

    initializeJitsi(convertVideoToJitsiLive(video)!, false, node);

    const toolbarButtons = [
      'camera',
      'closedcaptions',
      'desktop',
      'feedback',
      'filmstrip',
      'fullscreen',
      'fodeviceselection',
      'help',
      'microphone',
      'mute-everyone',
      'mute-video-everyone',
      'participants-pane',
      'profile',
      'raisehand',
      'security',
      'select-background',
      'settings',
      'sharedvideo',
      'shortcuts',
      'tileview',
      'videoquality',
    ];

    expect(mockJitsi).toHaveBeenCalledTimes(1);
    expect(mockJitsi).toHaveBeenCalledWith('domain', {
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
        disableDeepLinking: true,
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        prejoinConfig: {
          enabled: false,
        },
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      jwt: undefined,
      parentNode: node,
      roomName: 'room name',
      userInfo: {
        displayName: 'some display name',
      },
    });
  });

  it('uses jwt user name', () => {
    const video = liveMockFactory({
      live_type: LiveModeType.JITSI,
      live_info: {
        jitsi: {
          external_api_url: 'external api url',
          domain: 'domain',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'room name',
        },
      },
      live_state: liveState.RUNNING,
    });
    useCurrentUser.setState({
      currentUser: {
        username: 'user name',
      } as any,
    });

    initializeJitsi(convertVideoToJitsiLive(video)!, false, node);

    const toolbarButtons = [
      'camera',
      'closedcaptions',
      'desktop',
      'feedback',
      'filmstrip',
      'fullscreen',
      'fodeviceselection',
      'help',
      'microphone',
      'mute-everyone',
      'mute-video-everyone',
      'participants-pane',
      'profile',
      'raisehand',
      'security',
      'select-background',
      'settings',
      'sharedvideo',
      'shortcuts',
      'tileview',
      'videoquality',
    ];

    expect(mockJitsi).toHaveBeenCalledTimes(1);
    expect(mockJitsi).toHaveBeenCalledWith('domain', {
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
        disableDeepLinking: true,
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        prejoinConfig: {
          enabled: false,
        },
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      jwt: undefined,
      parentNode: node,
      roomName: 'room name',
      userInfo: {
        displayName: 'user name',
      },
    });
  });

  it('disables prejoin page when join mode is forced and user is not instructor', () => {
    const video = liveMockFactory({
      live_type: LiveModeType.JITSI,
      live_info: {
        jitsi: {
          external_api_url: 'external api url',
          domain: 'domain',
          config_overwrite: {
            prejoinConfig: {
              enabled: true,
            },
          },
          interface_config_overwrite: {},
          room_name: 'room name',
        },
      },
      live_state: liveState.RUNNING,
      join_mode: JoinMode.FORCED,
    });
    useCurrentUser.setState({
      currentUser: {
        username: 'user name',
      } as any,
    });

    initializeJitsi(convertVideoToJitsiLive(video)!, false, node);

    const toolbarButtons = [
      'camera',
      'closedcaptions',
      'desktop',
      'feedback',
      'filmstrip',
      'fullscreen',
      'fodeviceselection',
      'help',
      'microphone',
      'mute-everyone',
      'mute-video-everyone',
      'participants-pane',
      'profile',
      'raisehand',
      'security',
      'select-background',
      'settings',
      'sharedvideo',
      'shortcuts',
      'tileview',
      'videoquality',
    ];

    expect(mockJitsi).toHaveBeenCalledTimes(1);
    expect(mockJitsi).toHaveBeenCalledWith('domain', {
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
        disableDeepLinking: true,
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        prejoinConfig: {
          enabled: false,
        },
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      jwt: undefined,
      parentNode: node,
      roomName: 'room name',
      userInfo: {
        displayName: 'user name',
      },
    });
  });

  it('does not disable prejoin page when join mode is forced and user is instructor', () => {
    const video = liveMockFactory({
      live_type: LiveModeType.JITSI,
      live_info: {
        jitsi: {
          external_api_url: 'external api url',
          domain: 'domain',
          config_overwrite: {
            prejoinConfig: {
              enabled: true,
            },
          },
          interface_config_overwrite: {},
          room_name: 'room name',
        },
      },
      live_state: liveState.RUNNING,
      join_mode: JoinMode.FORCED,
    });
    useCurrentUser.setState({
      currentUser: {
        username: 'user name',
      } as any,
    });

    initializeJitsi(convertVideoToJitsiLive(video)!, true, node);

    const toolbarButtons = [
      'camera',
      'closedcaptions',
      'desktop',
      'feedback',
      'filmstrip',
      'fullscreen',
      'fodeviceselection',
      'help',
      'microphone',
      'mute-everyone',
      'mute-video-everyone',
      'participants-pane',
      'profile',
      'raisehand',
      'security',
      'select-background',
      'settings',
      'sharedvideo',
      'shortcuts',
      'tileview',
      'videoquality',
    ];

    expect(mockJitsi).toHaveBeenCalledTimes(1);
    expect(mockJitsi).toHaveBeenCalledWith('domain', {
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
        disableDeepLinking: true,
        disablePolls: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        prejoinConfig: {
          enabled: true,
        },
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      jwt: undefined,
      parentNode: node,
      roomName: 'room name',
      userInfo: {
        displayName: 'user name',
      },
    });
  });
});

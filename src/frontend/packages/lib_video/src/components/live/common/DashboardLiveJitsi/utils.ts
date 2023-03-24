/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  AnonymousUser,
  useCurrentUser,
  JoinMode,
  LiveJitsi,
  JitsiMeetExternalAPI,
} from 'lib-components';

import { useLiveSession } from '@lib-video/hooks/useLiveSession';

const loadScript = (scriptUrl: string) =>
  new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = resolve;
    document.body.appendChild(script);
  });

// toolbar config must be set in both configOverwrite and interfaceConfigOverwrite. This settings
// has moved from interfaceConfigOverwrite to configOverwrite and depending the jitsi version used
// we don't know which one to use. Settings both does not raise an error, there is no check on
// extra settings.
export const toolbarButtons = [
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

export const initializeJitsi = async (
  live: LiveJitsi,
  isInstructor: boolean,
  jitsiNode: HTMLDivElement,
): Promise<JitsiMeetExternalAPI> => {
  const user = useCurrentUser.getState().currentUser;

  if (!window.JitsiMeetExternalAPI) {
    await loadScript(live.live_info.jitsi.external_api_url);
  }

  const configOverwrite: JitsiMeetExternalAPI.ConfigOverwriteOptions = {
    constraints: {
      video: {
        height: {
          ideal: 720,
          max: 720,
          min: 240,
        },
      },
    },
    // Controls the visibility and behavior of the top header conference info labels.
    // If a label's id is not in any of the 2 arrays, it will not be visible at all on the header.
    conferenceInfo: {
      // those labels will not be hidden in tandem with the toolbox.
      alwaysVisible: [
        'recording',
        // 'local-recording'
      ],
      // those labels will be auto-hidden in tandem with the toolbox buttons.
      autoHide: [
        // 'subject',
        // 'conference-timer',
        // 'participants-count',
        // 'e2ee',
        // 'transcribing',
        // 'video-quality',
        // 'insecure-room'
      ],
    },
    // If true, any checks to handoff to another application will be prevented
    // and instead the app will continue to display in the current browser.
    disableDeepLinking: true,
    disablePolls: true,
    // Disables storing the room name to the recents list
    doNotStoreRoom: true,
    // Hides the conference subject
    hideConferenceSubject: true,
    // Hides the conference timer.
    hideConferenceTimer: true,
    prejoinConfig: {
      enabled: false,
    },
    resolution: 720,
    toolbarButtons,
    ...live.live_info.jitsi.config_overwrite,
  };

  if (live.join_mode === JoinMode.FORCED && !isInstructor) {
    configOverwrite.prejoinConfig = {
      ...(configOverwrite.prejoinConfig || {}),
      enabled: false,
    };
  }

  return new window.JitsiMeetExternalAPI(live.live_info.jitsi.domain, {
    configOverwrite,
    interfaceConfigOverwrite: {
      HIDE_INVITE_MORE_HEADER: true,
      TOOLBAR_BUTTONS: toolbarButtons,
      ...live.live_info.jitsi.interface_config_overwrite,
    },
    jwt: live.live_info.jitsi.token,
    parentNode: jitsiNode,
    roomName: live.live_info.jitsi.room_name,
    userInfo: {
      displayName:
        useLiveSession.getState().liveSession?.display_name ||
        (user !== AnonymousUser.ANONYMOUS ? user?.username : undefined),
    },
  });
};

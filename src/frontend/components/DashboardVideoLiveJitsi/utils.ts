import { getDecodedJwt } from 'data/appData';
import { useLiveSession } from 'data/stores/useLiveSession';
import { JoinMode, LiveJitsi } from 'types/tracks';

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
export const studentToolbarButtons = [
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

export const instructorToolbarButtons = [
  ...studentToolbarButtons,
  'participants-pane',
  'sharedvideo',
];

export const initializeJitsi = async (
  live: LiveJitsi,
  isInstructor: boolean,
  jitsiNode: HTMLDivElement,
): Promise<JitsiMeetExternalAPI> => {
  if (!window.JitsiMeetExternalAPI) {
    await loadScript(live.live_info.jitsi.external_api_url);
  }

  const toolbarButtons = isInstructor
    ? instructorToolbarButtons
    : studentToolbarButtons;

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
    prejoinPageEnabled: false,
    resolution: 720,
    toolbarButtons,
    ...live.live_info.jitsi.config_overwrite,
  };

  if (live.join_mode === JoinMode.FORCED && !isInstructor) {
    configOverwrite.prejoinPageEnabled = false;
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
        getDecodedJwt().user?.username,
    },
  });
};

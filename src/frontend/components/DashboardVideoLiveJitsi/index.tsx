import { Box } from 'grommet';
import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { PLAYER_ROUTE } from 'components/routes';
import { getDecodedJwt } from 'data/appData';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { modelName } from 'types/models';
import { Video, liveState } from 'types/tracks';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { report } from 'utils/errors/report';
import { converse } from 'utils/window';

interface DashboardVideoLiveJitsiProps {
  setCanStartLive?: undefined;
  setCanShowStartButton?: undefined;
  video: Video;
  isInstructor?: false;
}

interface DashboardVideoLiveJitsiInstructorProps {
  setCanStartLive: (canStartLive: boolean) => void;
  setCanShowStartButton: (canShowStartButton: boolean) => void;
  video: Video;
  isInstructor: true;
}

const DashboardVideoLiveJitsi = ({
  setCanStartLive = () => undefined,
  setCanShowStartButton = () => undefined,
  video,
  isInstructor = false,
}: DashboardVideoLiveJitsiProps | DashboardVideoLiveJitsiInstructorProps) => {
  const jitsiNode = useRef(null);
  const jitsi = useRef<JitsiMeetExternalAPI>();
  const jitsiIsRecording = useRef(false);
  const isModerator = useRef(false);
  const endpoints = useRef<string[]>();
  const retryDelayStep = 2000;
  const retryStartRecordingDelay = useRef(retryDelayStep);
  const reset = useParticipantWorkflow((state) => state.reset);
  const history = useHistory();

  const loadJitsiScript = () =>
    new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = video.live_info.jitsi!.external_api_url!;
      script.async = true;
      script.onload = resolve;
      document.body.appendChild(script);
    });

  const startRecording = (jitsiApi: JitsiMeetExternalAPI) => {
    if (
      !isInstructor ||
      jitsiIsRecording.current ||
      isModerator.current === false
    ) {
      return;
    }

    jitsiApi.executeCommand('startRecording', {
      mode: 'stream',
      rtmpStreamKey: endpoints.current![0]!,
    });
    jitsiIsRecording.current = true;
  };

  const initialiseJitsi = async () => {
    if (!window.JitsiMeetExternalAPI) {
      await loadJitsiScript();
    }

    // toolbar config must be set in both configOverwrite and interfaceConfigOverwrite. This settings
    // has moved from interfaceConfigOverwrite to configOverwrite and depending the jitsi version used
    // we don't know which one to use. Settings both does not raise an error, there is no check on
    // extra settings.
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
      ...video.live_info.jitsi!.config_overwrite,
    };

    const _jitsi = new window.JitsiMeetExternalAPI(
      video.live_info.jitsi!.domain!,
      {
        configOverwrite,
        interfaceConfigOverwrite: {
          HIDE_INVITE_MORE_HEADER: true,
          TOOLBAR_BUTTONS: toolbarButtons,
          ...video.live_info.jitsi!.interface_config_overwrite,
        },
        jwt: video.live_info.jitsi?.token,
        parentNode: jitsiNode.current!,
        roomName: video.live_info.jitsi!.room_name,
        userInfo: {
          displayName: getDecodedJwt().user?.username,
        },
      },
    );

    _jitsi.addListener('recordingStatusChanged', async (event) => {
      // recording as stopped with an error
      if (!event.on && event.error) {
        // When a live is running, all moderators are triggering the startRecording command
        // Only one will success all others will fail with the error `unexpected-request`.
        // In that case we must not start trying to start the recording again and again like
        // for other errors. We must stop the function here.
        if (['unexpected-request', 'not-allowed'].includes(event.error)) {
          return;
        }
        jitsiIsRecording.current = false;
        report(event);
        await new Promise((resolve) =>
          window.setTimeout(resolve, retryStartRecordingDelay.current),
        );
        if (retryStartRecordingDelay.current < 20000)
          retryStartRecordingDelay.current += retryDelayStep;
        startRecording(_jitsi);
      }

      // Normal stop, set jitsiIsRecording to false to allow a resume
      if (!event.on && !event.error) {
        jitsiIsRecording.current = false;
      }

      // recording has started. Reset the retry delay and set jitsiIsRecording to true
      // to avoid intempestive start for other moderators.
      if (event.on) {
        retryStartRecordingDelay.current = retryDelayStep;
        jitsiIsRecording.current = true;
      }
    });

    if (!isInstructor) {
      _jitsi.addListener('videoConferenceLeft', () => {
        _jitsi.dispose();
        converse.participantLeaves();
        reset();
        history.push(PLAYER_ROUTE(modelName.VIDEOS));
      });
    }

    if (isInstructor) {
      _jitsi.addListener('participantRoleChanged', (event) => {
        isModerator.current = event.role === 'moderator';
        setCanStartLive(isModerator.current);
      });

      _jitsi.addListener('videoConferenceJoined', () => {
        setCanShowStartButton(true);
      });

      _jitsi.addListener('videoConferenceLeft', () => {
        _jitsi.dispose();
        setCanStartLive(false);
        setCanShowStartButton(false);
        initialiseJitsi();
      });
    }

    jitsi.current = _jitsi;
  };

  useAsyncEffect(async () => {
    if (!jitsi.current) {
      await initialiseJitsi();
    }
    if (video.live_state === liveState.RUNNING && video.live_info.medialive) {
      const endpointIdentifier = /^(rtmp:\/\/.*)\/(.*)$/;
      endpoints.current = video.live_info.medialive.input.endpoints.map(
        (endpoint) => {
          const matches = endpoint.match(endpointIdentifier)!;
          return `${matches[1]}/marsha/${matches[2]}`;
        },
      );
      startRecording(jitsi.current!);
    }

    if (video.live_state === liveState.STOPPING && jitsiIsRecording.current) {
      jitsi.current!.executeCommand('stopRecording', 'stream');
    }
  }, [video.live_state, video.live_info.medialive, isModerator.current]);

  return <Box height={'large'} ref={jitsiNode} />;
};

export default DashboardVideoLiveJitsi;

import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Redirect } from 'react-router-dom';

import { PLAYER_ROUTE } from 'components/routes';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { modelName } from 'types/models';
import { LiveJitsi, liveState } from 'types/tracks';
import { report } from 'utils/errors/report';
import { converse } from 'utils/window';
import { useJitsiApi } from 'data/stores/useJitsiApi';

import { initializeJitsi } from './utils';

const retryDelayStep = 2000;

interface DashboardLiveJitsiProps {
  setCanStartLive?: undefined;
  setCanShowStartButton?: undefined;
  liveJitsi: LiveJitsi;
  isInstructor?: false;
}

interface DashboardLiveJitsiInstructorProps {
  setCanStartLive: (canStartLive: boolean) => void;
  setCanShowStartButton: (canShowStartButton: boolean) => void;
  liveJitsi: LiveJitsi;
  isInstructor: true;
}

const DashboardLiveJitsi = ({
  setCanStartLive = () => undefined,
  setCanShowStartButton = () => undefined,
  liveJitsi,
  isInstructor = false,
}: DashboardLiveJitsiProps | DashboardLiveJitsiInstructorProps) => {
  const jitsiNode = useRef<Nullable<HTMLDivElement>>(null);
  const [jitsi, setJitsiApi] = useJitsiApi();
  const [isJitsiRecording, setIsJitsiRecording] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [redirectPath, setRedirectPath] = useState<Nullable<string>>(null);
  const resetParticipantWorkflow = useParticipantWorkflow(
    (state) => state.reset,
  );
  const [height, setHeight] = useState(0);

  const endpoints = useMemo(() => {
    const endpointIdentifier = /^(rtmp:\/\/.*)\/(.*)$/;
    return liveJitsi.live_info.medialive?.input.endpoints.map((endpoint) => {
      const matches = endpoint.match(endpointIdentifier)!;
      return `${matches[1]}/marsha/${matches[2]}`;
    });
  }, [liveJitsi]);

  const retryStartRecordingDelay = useRef(retryDelayStep);

  const startRecording = useCallback(
    (jitsiApi: JitsiMeetExternalAPI) => {
      if (
        !isInstructor ||
        !isModerator ||
        isJitsiRecording ||
        !endpoints ||
        endpoints.length === 0
      ) {
        return;
      }

      jitsiApi.executeCommand('startRecording', {
        mode: 'stream',
        rtmpStreamKey: endpoints[0],
      });
      setIsJitsiRecording(true);
    },
    [isInstructor, isModerator, isJitsiRecording, endpoints],
  );

  //  initialize jitsi api
  useEffect(() => {
    let canceled = false;
    const init = async () => {
      if (!jitsiNode.current || jitsi) {
        return;
      }

      const _jitsi = await initializeJitsi(
        liveJitsi,
        isInstructor,
        jitsiNode.current,
      );
      if (canceled) {
        return;
      }
      setJitsiApi(_jitsi);
    };

    init();
    return () => {
      canceled = true;

      if (jitsi) {
        jitsi.dispose();
        setJitsiApi(undefined);
      }
    };
  }, [jitsi, isInstructor]);

  //  handle jitsi recording according to live state
  useEffect(() => {
    if (!jitsi) {
      return;
    }

    if (liveJitsi.live_state === liveState.RUNNING && isModerator) {
      startRecording(jitsi);
    }

    if (liveJitsi.live_state === liveState.STOPPING && isJitsiRecording) {
      jitsi.executeCommand('stopRecording', 'stream');
    }
  }, [jitsi, liveJitsi, isModerator, startRecording]);

  //  configure jitsi api event handlers
  useEffect(() => {
    if (!jitsi) {
      return;
    }

    const recordingStatusChanged = async (event: any) => {
      // recording as stopped with an error
      if (!event.on && event.error) {
        // When a live is running, all moderators are triggering the startRecording command
        // Only one will success all others will fail with the error `unexpected-request`.
        // In that case we must not start trying to start the recording again and again like
        // for other errors. We must stop the function here.
        if (['unexpected-request', 'not-allowed'].includes(event.error)) {
          return;
        }
        setIsJitsiRecording(false);
        report(event);
        await new Promise((resolve) =>
          window.setTimeout(resolve, retryStartRecordingDelay.current),
        );
        if (retryStartRecordingDelay.current < 20000)
          retryStartRecordingDelay.current += retryDelayStep;
        startRecording(jitsi);
      }

      // Normal stop, set jitsiIsRecording to false to allow a resume
      if (!event.on && !event.error) {
        setIsJitsiRecording(false);
      }

      // recording has started. Reset the retry delay and set jitsiIsRecording to true
      // to avoid intempestive start for other moderators.
      if (event.on) {
        retryStartRecordingDelay.current = retryDelayStep;
        setIsJitsiRecording(true);
      }
    };
    jitsi.addListener('recordingStatusChanged', recordingStatusChanged);
    return () => {
      if (!jitsi) {
        return;
      }

      jitsi.removeListener('recordingStatusChanged', recordingStatusChanged);
    };
  }, [jitsi, startRecording]);

  useEffect(() => {
    if (!jitsi || isInstructor) {
      return;
    }

    const listener = () => {
      jitsi.dispose();
      setJitsiApi(undefined);

      converse.participantLeaves();
      resetParticipantWorkflow();
      setRedirectPath(PLAYER_ROUTE(modelName.VIDEOS));
    };
    jitsi.addListener('readyToClose', listener);
    return () => {
      if (!jitsi) {
        return;
      }

      jitsi.removeListener('readyToClose', listener);
    };
  }, [jitsi, isInstructor]);

  useEffect(() => {
    if (!jitsi || !isInstructor) {
      return;
    }

    const participantRoleChanged = (event: any) => {
      setIsModerator(event.role === 'moderator');
    };
    jitsi.addListener('participantRoleChanged', participantRoleChanged);

    const videoConferenceJoined = () => {
      setCanShowStartButton(true);
    };
    jitsi.addListener('videoConferenceJoined', videoConferenceJoined);

    const readyToClose = () => {
      jitsi.dispose();
      setJitsiApi(undefined);

      setCanStartLive(false);
      setCanShowStartButton(false);
    };
    jitsi.addListener('readyToClose', readyToClose);

    return () => {
      if (!jitsi) {
        return;
      }

      jitsi.removeListener('participantRoleChanged', participantRoleChanged);
      jitsi.removeListener('videoConferenceJoined', videoConferenceJoined);
      jitsi.removeListener('readyToClose', readyToClose);
    };
  }, [jitsi, isInstructor]);

  useEffect(() => {
    setCanStartLive(isModerator);
  }, [isModerator]);

  useEffect(() => {
    if (!jitsiNode.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!jitsiNode.current) {
        return;
      }

      const ratio = 16 / 9;
      setHeight(jitsiNode.current.offsetWidth / ratio);
    });
    observer.observe(jitsiNode.current);
    return () => {
      if (!jitsiNode.current) {
        return;
      }

      observer.unobserve(jitsiNode.current);
    };
  }, []);

  if (redirectPath) {
    return <Redirect to={redirectPath} />;
  }

  return <Box ref={jitsiNode} width="100%" height={`${height}px`} />;
};

export default DashboardLiveJitsi;

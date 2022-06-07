import { Box } from 'grommet';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Redirect } from 'react-router-dom';

import { PLAYER_ROUTE } from 'components/routes';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { modelName } from 'types/models';
import { LiveJitsi, liveState } from 'types/tracks';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { report } from 'utils/errors/report';
import { converse } from 'utils/window';
import { useJitsiApi } from 'data/stores/useJitsiApi';
import { Nullable } from 'utils/types';

import { initialiseJitsi } from './utils';

const retryDelayStep = 2000;

interface DashboardVideoLiveJitsiProps {
  setCanStartLive?: undefined;
  setCanShowStartButton?: undefined;
  liveJitsi: LiveJitsi;
  isInstructor?: false;
}

interface DashboardVideoLiveJitsiInstructorProps {
  setCanStartLive: (canStartLive: boolean) => void;
  setCanShowStartButton: (canShowStartButton: boolean) => void;
  liveJitsi: LiveJitsi;
  isInstructor: true;
}

const DashboardVideoLiveJitsi = ({
  setCanStartLive = () => undefined,
  setCanShowStartButton = () => undefined,
  liveJitsi,
  isInstructor = false,
}: DashboardVideoLiveJitsiProps | DashboardVideoLiveJitsiInstructorProps) => {
  const jitsiNode = useRef<Nullable<HTMLDivElement>>(null);
  const [jitsi, setJitsiApi] = useJitsiApi();
  const [isJitsiRecording, setIsJitsiRecording] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [redirectPath, setRedirectPath] = useState<Nullable<string>>(null);
  const resetParticipantWorkflow = useParticipantWorkflow(
    (state) => state.reset,
  );

  const endpoints = useMemo(() => {
    const endpointIdentifier = /^(rtmp:\/\/.*)\/(.*)$/;
    return liveJitsi.live_info.medialive?.input.endpoints.map((endpoint) => {
      const matches = endpoint.match(endpointIdentifier)!;
      return `${matches[1]}/marsha/${matches[2]}`;
    });
  }, [liveJitsi]);

  const retryStartRecordingDelay = useRef(retryDelayStep);

  const startRecording = (jitsiApi: JitsiMeetExternalAPI) => {
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
  };

  //  initialize jitsi api
  useAsyncEffect(async () => {
    if (jitsi || !jitsiNode.current) {
      return;
    }

    const _jitsi = await initialiseJitsi(liveJitsi, jitsiNode.current);
    setJitsiApi(_jitsi);
  }, [jitsi]);

  //  handle jitsi recording according to live state
  useEffect(() => {
    if (!jitsi) {
      return;
    }

    if (liveJitsi.live_state === liveState.RUNNING) {
      startRecording(jitsi);
    }

    if (liveJitsi.live_state === liveState.STOPPING && isJitsiRecording) {
      jitsi.executeCommand('stopRecording', 'stream');
    }
  }, [jitsi, liveJitsi]);

  //  configure jitsi api event handlers
  useEffect(() => {
    if (!jitsi) {
      return;
    }

    jitsi.addListener('recordingStatusChanged', async (event) => {
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
    });

    if (!isInstructor) {
      jitsi.addListener('videoConferenceLeft', () => {
        jitsi.dispose();
        setJitsiApi(undefined);

        converse.participantLeaves();
        resetParticipantWorkflow();
        setRedirectPath(PLAYER_ROUTE(modelName.VIDEOS));
      });
    } else {
      jitsi.addListener('participantRoleChanged', (event) => {
        setIsModerator(event.role === 'moderator');
      });

      jitsi.addListener('videoConferenceJoined', () => {
        setCanShowStartButton(true);
      });

      jitsi.addListener('videoConferenceLeft', () => {
        jitsi.dispose();
        setJitsiApi(undefined);

        setCanStartLive(false);
        setCanShowStartButton(false);
      });
    }
  }, [jitsi]);

  useEffect(() => {
    setCanStartLive(isModerator);
  }, [isModerator]);

  if (redirectPath) {
    return <Redirect to={redirectPath} />;
  }

  return <Box ref={jitsiNode} style={{ aspectRatio: '4/3' }} />;
};

export default DashboardVideoLiveJitsi;

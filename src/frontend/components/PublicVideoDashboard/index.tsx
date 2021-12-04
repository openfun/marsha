import { Box } from 'grommet';
import React from 'react';
import { Navigate } from 'react-router-dom';

import { Chat } from 'components/Chat';
import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { DownloadVideo } from 'components/DownloadVideo';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { JoinDiscussionAskButton } from 'components/JoinDiscussionAskButton';
import { SubscribeScheduledVideo } from 'components/SubscribeScheduledVideo';
import { Transcripts } from 'components/Transcripts';
import VideoPlayer from 'components/VideoPlayer';
import { WaitingLiveVideo } from 'components/WaitingLiveVideo';
import { getDecodedJwt } from 'data/appData';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { useVideo } from 'data/stores/useVideo';
import { modelName } from 'types/models';
import {
  LiveModeType,
  liveState,
  timedTextMode,
  TimedTextTranscript,
  Video,
} from 'types/tracks';

interface PublicVideoDashboardProps {
  video: Video;
  playerType: string;
}

const PublicVideoDashboard = ({
  video: baseVideo,
  playerType,
}: PublicVideoDashboardProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));
  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );
  const displayJoinDiscussionAskButton =
    video.xmpp &&
    video.live_type === LiveModeType.JITSI &&
    ![liveState.STOPPING, liveState.PAUSED].includes(video.live_state!);

  if (video.live_state !== null) {
    switch (video.live_state) {
      case liveState.RUNNING:
      case liveState.PAUSED:
      case liveState.STOPPING:
        return (
          <Box>
            <Box direction="row">
              <Box basis={video.xmpp ? 'xlarge' : 'auto'}>
                <VideoPlayer
                  video={video}
                  playerType={playerType}
                  timedTextTracks={[]}
                />
              </Box>
              {video.xmpp && (
                <Box>
                  <Chat video={video} />
                </Box>
              )}
            </Box>
            {displayJoinDiscussionAskButton && (
              <Box
                direction="row"
                margin="small"
                alignContent="center"
                justify="center"
              >
                <JoinDiscussionAskButton />
              </Box>
            )}
          </Box>
        );
      case liveState.STOPPED:
        // user has update permission, we redirect him to the dashboard
        if (getDecodedJwt().permissions.can_update) {
          return <Navigate to={DASHBOARD_ROUTE(modelName.VIDEOS)} />;
        }

        // otherwise the user can only see a message
        return <Navigate to={FULL_SCREEN_ERROR_ROUTE('liveStopped')} />;
      case liveState.IDLE:
        if (video.is_scheduled) {
          return <SubscribeScheduledVideo video={video} />;
        }
        // waiting message
        return <WaitingLiveVideo video={video} />;
      default:
        // waiting message
        return <WaitingLiveVideo video={video} />;
    }
  }

  const transcripts = timedTextTracks
    .filter((track) => track.is_ready_to_show)
    .filter((track) =>
      video.has_transcript === false && video.should_use_subtitle_as_transcript
        ? timedTextMode.SUBTITLE === track.mode
        : timedTextMode.TRANSCRIPT === track.mode,
    );

  return (
    <Box>
      <VideoPlayer
        video={video}
        playerType={playerType}
        timedTextTracks={timedTextTracks}
      />
      {video.show_download && <DownloadVideo urls={video.urls!} />}
      {transcripts.length > 0 && (
        <Transcripts transcripts={transcripts as TimedTextTranscript[]} />
      )}
    </Box>
  );
};

export default PublicVideoDashboard;

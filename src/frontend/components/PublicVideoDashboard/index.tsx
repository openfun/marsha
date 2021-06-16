import { Box } from 'grommet';
import React from 'react';
import { Redirect } from 'react-router-dom';

import { Chat } from '../Chat';
import { DownloadVideo } from '../DownloadVideo';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { Transcripts } from '../Transcripts';
import VideoPlayer from '../VideoPlayer';
import { WaitingLiveVideo } from '../WaitingLiveVideo';
import { useTimedTextTrack } from '../../data/stores/useTimedTextTrack';
import { useVideo } from '../../data/stores/useVideo';
import {
  liveState,
  timedTextMode,
  TimedTextTranscript,
  Video,
} from '../../types/tracks';

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

  if (video.live_state !== null) {
    switch (video.live_state) {
      case liveState.RUNNING:
        return (
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
        );
      case liveState.STOPPED:
      case liveState.STOPPING:
        // nothing to show
        return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
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

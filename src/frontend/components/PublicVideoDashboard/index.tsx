import { Box } from 'grommet';
import React from 'react';

import { Chat } from '../Chat';
import { DownloadVideo } from '../DownloadVideo';
import { Transcripts } from '../Transcripts';
import VideoPlayer from '../VideoPlayer';
import { useTimedTextTrack } from '../../data/stores/useTimedTextTrack';
import { useVideo } from '../../data/stores/useVideo';
import { timedTextMode, TimedTextTranscript, Video } from '../../types/tracks';

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

  if (video.live_state !== null && video.xmpp) {
    return (
      <Box direction="row">
        <Box basis="xlarge">
          <VideoPlayer
            video={video}
            playerType={playerType}
            timedTextTracks={[]}
          />
        </Box>
        <Box>
          <Chat video={video} />
        </Box>
      </Box>
    );
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

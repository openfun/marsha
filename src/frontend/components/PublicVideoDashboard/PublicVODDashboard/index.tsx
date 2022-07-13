import { Box } from 'grommet';
import React from 'react';
import { Redirect } from 'react-router-dom';

import { DownloadVideo } from 'components/DownloadVideo';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { Transcripts } from 'components/Transcripts';
import VideoPlayer from 'components/VideoPlayer';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { timedTextMode, TimedTextTranscript, uploadState } from 'types/tracks';

interface PublicVODDashboardProps {
  playerType: string;
}

export const PublicVODDashboard = ({ playerType }: PublicVODDashboardProps) => {
  const video = useCurrentVideo();
  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );

  const transcripts = timedTextTracks
    .filter((track) => track.is_ready_to_show)
    .filter((track) =>
      video.has_transcript === false && video.should_use_subtitle_as_transcript
        ? timedTextMode.SUBTITLE === track.mode
        : timedTextMode.TRANSCRIPT === track.mode,
    );

  if (video.upload_state === uploadState.DELETED) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('videoDeleted')} />;
  }

  if (!video.urls) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE()} />;
  }

  return (
    <Box>
      <VideoPlayer
        video={video}
        playerType={playerType}
        timedTextTracks={timedTextTracks}
      />
      {video.show_download && <DownloadVideo urls={video.urls} />}
      {transcripts.length > 0 && (
        <Transcripts transcripts={transcripts as TimedTextTranscript[]} />
      )}
    </Box>
  );
};

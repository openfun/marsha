import { Box } from 'grommet';
import 'plyr/dist/plyr.css';
import React, { useEffect, useRef, useState } from 'react';
import { Redirect } from 'react-router';

import { useThumbnail } from '../../data/stores/useThumbnail';
import { useTimedTextTrack } from '../../data/stores/useTimedTextTrack';
import { useTimedTextTrackLanguageChoices } from '../../data/stores/useTimedTextTrackLanguageChoices';
import { useVideo } from '../../data/stores/useVideo';
import { useVideoProgress } from '../../data/stores/useVideoProgress';
import { createPlayer } from '../../Player/createPlayer';
import {
  timedTextMode,
  TimedTextTranscript,
  Video,
  videoSize,
} from '../../types/tracks';
import { VideoPlayerInterface } from '../../types/VideoPlayer';
import { isHlsSupported, isMSESupported } from '../../utils/isAbrSupported';
import { Maybe, Nullable } from '../../utils/types';
import { DownloadVideo } from '../DownloadVideo';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { Transcripts } from '../Transcripts';
import './VideoPlayer.css'; // Improve some plyr styles

const trackTextKind: { [key in timedTextMode]?: string } = {
  [timedTextMode.CLOSED_CAPTIONING]: 'captions',
  [timedTextMode.SUBTITLE]: 'subtitles',
};

interface BaseVideoPlayerProps {
  video: Nullable<Video>;
  playerType: string;
}

const VideoPlayer = ({
  video: baseVideo,
  playerType,
}: BaseVideoPlayerProps) => {
  const [player, setPlayer] = useState(
    undefined as Maybe<VideoPlayerInterface>,
  );
  const videoNodeRef = useRef(null as Nullable<HTMLVideoElement>);

  const { choices, getChoices } = useTimedTextTrackLanguageChoices(
    (state) => state,
  );

  const video = useVideo((state) => state.getVideo(baseVideo));
  const thumbnail = useThumbnail((state) => state.getThumbnail());
  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );

  const setPlayerCurrentTime = useVideoProgress(
    (state) => state.setPlayerCurrentTime,
  );

  const languages: { [key: string]: string } =
    (choices &&
      choices.reduce(
        (acc, current) => ({
          ...acc,
          [current.value]: current.label,
        }),
        {},
      )) ||
    {};

  /**
   * Initialize the `Plyr` video player and our adaptive bitrate library if applicable.
   * Noop out if the video or jwt is missing, render will redirect to an error page.
   */
  useEffect(() => {
    getChoices();

    if (video) {
      // Instantiate Plyr and keep the instance in state
      setPlayer(
        createPlayer(
          playerType,
          videoNodeRef.current!,
          setPlayerCurrentTime,
          video,
        ),
      );

      document.dispatchEvent(
        new CustomEvent('marsha_player_created', {
          detail: {
            videoNode: videoNodeRef.current!,
          },
        }),
      );

      /** Make sure to destroy the player on unmount. */
      return () => player && player.destroy();
    }
  }, []);

  // The video is somehow missing and jwt must be set
  if (!video) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
  }

  const transcripts = timedTextTracks
    .filter((track) => track.is_ready_to_show)
    .filter((track) =>
      video.has_transcript === false && video.should_use_subtitle_as_transcript
        ? timedTextMode.SUBTITLE === track.mode
        : timedTextMode.TRANSCRIPT === track.mode,
    );

  const thumbnailUrls =
    (thumbnail && thumbnail.is_ready_to_show && thumbnail.urls) ||
    video.urls.thumbnails;
  const resolutions = Object.keys(video.urls.mp4).map(
    (size) => Number(size) as videoSize,
  );

  return (
    <Box>
      {/* tabIndex is set to -1 to not take focus on this element when a user is navigating using
       their keyboard. */}
      <video
        ref={videoNodeRef}
        crossOrigin="anonymous"
        poster={thumbnailUrls[resolutions[resolutions.length - 1]]}
        tabIndex={-1}
      >
        {video.urls.manifests.dash && isMSESupported() && (
          <source
            src={video.urls.manifests.dash}
            size="auto"
            type="application/dash+xml"
          />
        )}

        {!!videoNodeRef.current && isHlsSupported(videoNodeRef.current) && (
          <source
            src={video.urls.manifests.hls}
            size="auto"
            type="application/x-mpegURL"
          />
        )}

        {resolutions.map((size) => (
          <source
            key={video.urls.mp4[size]}
            size={`${size}`}
            src={video.urls.mp4[size]}
            type="video/mp4"
          />
        ))}

        {timedTextTracks
          .filter((track) => track.is_ready_to_show)
          .filter((track) =>
            [timedTextMode.CLOSED_CAPTIONING, timedTextMode.SUBTITLE].includes(
              track.mode,
            ),
          )
          .map((track) => (
            <track
              key={track.id}
              src={track.url}
              srcLang={track.language}
              kind={trackTextKind[track.mode]}
              label={languages[track.language] || track.language}
            />
          ))}
      </video>
      {video.show_download && <DownloadVideo video={video} />}
      {transcripts.length > 0 && (
        <Transcripts transcripts={transcripts as TimedTextTranscript[]} />
      )}
    </Box>
  );
};

export default VideoPlayer;

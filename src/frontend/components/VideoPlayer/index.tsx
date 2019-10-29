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
import { isHlsSupported } from '../../utils/isAbrSupported';
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
}

const VideoPlayer = ({ video: baseVideo }: BaseVideoPlayerProps) => {
  const [player, setPlayer] = useState(undefined as Maybe<
    VideoPlayerInterface
  >);
  const videoNodeRef = useRef(null as Nullable<HTMLVideoElement>);

  const { choices, getChoices } = useTimedTextTrackLanguageChoices(
    state => state,
  );

  const video = useVideo(state => state.getVideo(baseVideo));
  const thumbnail = useThumbnail(state => state.getThumbnail());
  const timedTextTracks = useTimedTextTrack(state =>
    state.getTimedTextTracks(),
  );

  const setPlayerCurrentTime = useVideoProgress(
    state => state.setPlayerCurrentTime,
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
          'plyr',
          videoNodeRef.current!,
          setPlayerCurrentTime,
          video,
        ),
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
    .filter(track => track.is_ready_to_show)
    .filter(track => timedTextMode.TRANSCRIPT === track.mode);

  const thumbnailUrls =
    (thumbnail && thumbnail.is_ready_to_show && thumbnail.urls) ||
    video.urls.thumbnails;

  return (
    <Box>
      {/* tabIndex is set to -1 to not take focus on this element when a user is navigating using
       their keyboard. */}
      <video
        ref={videoNodeRef}
        crossOrigin="anonymous"
        poster={thumbnailUrls[720]}
        tabIndex={-1}
      >
        {!!videoNodeRef.current && isHlsSupported(videoNodeRef.current) && (
          <source
            src={video.urls.manifests.hls}
            size="auto"
            type="application/vnd.apple.mpegURL"
          />
        )}
        {!!videoNodeRef.current &&
          !isHlsSupported(videoNodeRef.current) &&
          (Object.keys(video.urls.mp4) as videoSize[]).map(size => (
            <source
              key={video.urls.mp4[size]}
              size={size}
              src={video.urls.mp4[size]}
              type="video/mp4"
            />
          ))}

        {/* This is a workaround to force plyr to load its tracks list once
          instantiated. Without this, captions are not loaded correctly, at least, on firefox.
          */}
        {player &&
          timedTextTracks
            .filter(track => track.is_ready_to_show)
            .filter(track =>
              [
                timedTextMode.CLOSED_CAPTIONING,
                timedTextMode.SUBTITLE,
              ].includes(track.mode),
            )
            .map(track => (
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

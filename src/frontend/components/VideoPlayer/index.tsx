import { Stack } from 'grommet';
import React, { useRef, useState, useEffect } from 'react';
import { Redirect } from 'react-router';

import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';

import { useThumbnail } from 'data/stores/useThumbnail';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import { useVideoProgress } from 'data/stores/useVideoProgress';
import { createPlayer } from 'Player/createPlayer';
import { TimedText, timedTextMode, Video, videoSize } from 'types/tracks';
import { VideoPlayerInterface } from 'types/VideoPlayer';
import { Nullable } from 'utils/types';
import { useIntl } from 'react-intl';

const trackTextKind: { [key in timedTextMode]?: string } = {
  [timedTextMode.CLOSED_CAPTIONING]: 'captions',
  [timedTextMode.SUBTITLE]: 'subtitles',
};

interface BaseVideoPlayerProps {
  video: Nullable<Video>;
  playerType: string;
  timedTextTracks: TimedText[];
  defaultVolume?: number;
}

const VideoPlayer = ({
  video,
  playerType,
  timedTextTracks,
  defaultVolume,
}: BaseVideoPlayerProps) => {
  const intl = useIntl();
  const [player, setPlayer] = useState<VideoPlayerInterface>();
  const videoNodeRef = useRef<Nullable<HTMLVideoElement>>(null);

  const { choices, getChoices } = useTimedTextTrackLanguageChoices(
    (state) => state,
  );

  const thumbnail = useThumbnail((state) => state.getThumbnail());

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
   * Initialize the video player.
   * Noop out if the video is missing, render will redirect to an error page.
   */
  useEffect(() => {
    getChoices();

    if (video) {
      // Instantiate the player and keep the instance in state
      setPlayer(
        createPlayer(
          playerType,
          videoNodeRef.current!,
          setPlayerCurrentTime,
          video,
          intl.locale,
          (videoPlayer) => {
            if (defaultVolume !== undefined) {
              videoPlayer.volume(Math.min(1, Math.max(0, defaultVolume)));
            }
          },
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
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
  }

  const thumbnailUrls =
    (thumbnail && thumbnail.is_ready_to_show && thumbnail.urls) ||
    video.urls!.thumbnails;
  const resolutions = Object.keys(video.urls!.mp4).map(
    (size) => Number(size) as videoSize,
  );

  // order resolutions from the higher to the lower
  resolutions.sort((a, b) => b - a);

  return (
    <Stack interactiveChild="last">
      {/* tabIndex is set to -1 to not take focus on this element when a user is navigating using
       their keyboard. */}
      <video
        ref={videoNodeRef}
        crossOrigin="anonymous"
        poster={thumbnailUrls[resolutions[0]]}
        tabIndex={-1}
      >
        {resolutions.map((size) => (
          <source
            key={video.urls!.mp4[size]}
            size={`${size}`}
            src={video.urls!.mp4[size]}
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
    </Stack>
  );
};

export default VideoPlayer;

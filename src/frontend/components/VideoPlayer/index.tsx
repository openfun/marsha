import { Box, Text } from 'grommet';
import React, { useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect } from 'react-router';

import { useThumbnail } from '../../data/stores/useThumbnail';
import { useTimedTextTrackLanguageChoices } from '../../data/stores/useTimedTextTrackLanguageChoices';
import { useVideoProgress } from '../../data/stores/useVideoProgress';
import { createPlayer } from '../../Player/createPlayer';
import { TimedText, timedTextMode, Video, videoSize } from '../../types/tracks';
import { VideoPlayerInterface } from '../../types/VideoPlayer';
import { useAsyncEffect } from '../../utils/useAsyncEffect';
import { Maybe, Nullable } from '../../utils/types';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';

const messages = defineMessages({
  liveOnGoing: {
    defaultMessage: 'Live is starting and will be displayed soon.',
    description: 'Waiting message when a live is starting',
    id: 'components.VideoPlayer.LiveOnDoing',
  },
});

const trackTextKind: { [key in timedTextMode]?: string } = {
  [timedTextMode.CLOSED_CAPTIONING]: 'captions',
  [timedTextMode.SUBTITLE]: 'subtitles',
};

interface BaseVideoPlayerProps {
  video: Nullable<Video>;
  playerType: string;
  timedTextTracks: TimedText[];
}

const VideoPlayer = ({
  video,
  playerType,
  timedTextTracks,
}: BaseVideoPlayerProps) => {
  const intl = useIntl();
  const [player, setPlayer] = useState(
    undefined as Maybe<VideoPlayerInterface>,
  );
  const videoNodeRef = useRef(null as Nullable<HTMLVideoElement>);

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
  useAsyncEffect(async () => {
    getChoices();

    if (video) {
      // Instantiate the player and keep the instance in state
      setPlayer(
        await createPlayer(
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
    <Box>
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
      {!player && video.live_state && (
        <Text size="large" textAlign="center">
          {intl.formatMessage(messages.liveOnGoing)}
        </Text>
      )}
    </Box>
  );
};

export default VideoPlayer;

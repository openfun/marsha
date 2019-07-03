import { MediaPlayer } from 'dashjs';
import { Box } from 'grommet';
import 'plyr/dist/plyr.css';
import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';

import { RootState } from '../../data/rootReducer';
import { useTimedTextTrackLanguageChoices } from '../../data/stores/useTimedTextTrackLanguageChoices';
import { useVideoProgress } from '../../data/stores/useVideoProgress';
import { getThumbnail } from '../../data/thumbnail/selector';
import { getTimedTextTracks } from '../../data/timedtexttracks/selector';
import { ConsumableQuery } from '../../types/api';
import { modelName } from '../../types/models';
import {
  Thumbnail,
  TimedText,
  timedTextMode,
  TimedTextTranscript,
  Video,
  videoSize,
} from '../../types/tracks';
import {
  VideoPlayerCreator,
  VideoPlayerInterface,
} from '../../types/VideoPlayer';
import { isHlsSupported, isMSESupported } from '../../utils/isAbrSupported';
import { Maybe, Nullable } from '../../utils/types';
import { useAsyncEffect } from '../../utils/useAsyncEffect';
import { DownloadVideo } from '../DownloadVideo';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { Transcripts } from '../Transcripts';
import './VideoPlayer.css'; // Improve some plyr styles

const trackTextKind: { [key in timedTextMode]?: string } = {
  [timedTextMode.CLOSED_CAPTIONING]: 'captions',
  [timedTextMode.SUBTITLE]: 'subtitles',
};

interface BaseVideoPlayerProps {
  createPlayer: VideoPlayerCreator;
  timedtexttracks: ConsumableQuery<TimedText>;
  thumbnail: Nullable<Thumbnail>;
  video: Nullable<Video>;
}

const BaseVideoPlayer = ({
  createPlayer,
  thumbnail,
  timedtexttracks,
  video,
}: BaseVideoPlayerProps) => {
  const [player, setPlayer] = useState(undefined as Maybe<
    VideoPlayerInterface
  >);
  const videoNodeRef = useRef(null as Nullable<HTMLVideoElement>);

  const { choices, getChoices } = useTimedTextTrackLanguageChoices();
  const { setPlayerCurrentTime } = useVideoProgress();

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
  useAsyncEffect(async () => {
    getChoices();

    if (video) {
      // Instantiate Plyr and keep the instance in state
      setPlayer(
        await createPlayer('plyr', videoNodeRef.current!, setPlayerCurrentTime),
      );

      if (isMSESupported()) {
        const dash = MediaPlayer().create();
        dash.initialize(
          videoNodeRef.current!,
          video.urls.manifests.dash,
          false,
        );
        dash.updateSettings({
          streaming: {
            abr: {
              initialBitrate: {
                video: 1600000,
              },
            },
          },
        } as dashjs.MediaPlayerSettingClass);
      }

      /** Make sure to destroy the player on unmount. */
      return () => player && player.destroy();
    }
  }, []);

  // The video is somehow missing and jwt must be set
  if (!video) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
  }

  const transcripts = timedtexttracks.objects
    .filter(track => track.is_ready_to_play)
    .filter(track => timedTextMode.TRANSCRIPT === track.mode);

  const thumbnailUrls =
    (thumbnail && thumbnail.is_ready_to_display && thumbnail.urls) ||
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
          timedtexttracks.objects
            .filter(track => track.is_ready_to_play)
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

type VideoPlayerProps = Pick<BaseVideoPlayerProps, 'createPlayer' | 'video'>;

/**
 * Replace the (read-only) video from context with one from the resources part of the
 * state if available as it will hold the most recent version.
 */
const mapStateToProps = (state: RootState, { video }: VideoPlayerProps) => ({
  thumbnail: getThumbnail(state),
  timedtexttracks: getTimedTextTracks(state),
  video:
    (state.resources[modelName.VIDEOS]!.byId &&
      state.resources[modelName.VIDEOS]!.byId[(video && video.id) || '']) ||
    video,
});

/**
 * Component. Displays a player to show the video from context.
 * @param createPlayer A PlayerCreator function that instantiates and sets up tracking for the video player
 * we want to use.
 * @param video The video to play.
 */
export const VideoPlayer = connect(mapStateToProps)(BaseVideoPlayer);

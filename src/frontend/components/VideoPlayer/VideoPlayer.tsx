import { MediaPlayer } from 'dashjs';
import 'plyr/dist/plyr.css';
import * as React from 'react';
import { Redirect } from 'react-router';

import { createPlayer } from '../../Player/createPlayer';
import { ConsumableQuery } from '../../types/api';
import { TimedText, timedTextMode, Video, videoSize } from '../../types/tracks';
import { VideoPlayerInterface } from '../../types/VideoPlayerInterface';
import { Maybe, Nullable } from '../../utils/types';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import './VideoPlayer.css'; // Improve some plyr styles

const trackTextKind: { [key in timedTextMode]?: string } = {
  [timedTextMode.CLOSED_CAPTIONING]: 'captions',
  [timedTextMode.SUBTITLE]: 'subtitles',
};

export interface VideoPlayerProps {
  getTimedTextTrackList: () => void;
  jwt: string;
  video: Nullable<Video>;
  createPlayer: typeof createPlayer;
  timedtexttracks: ConsumableQuery<TimedText>;
}

interface VideoPlayerState {
  player: Maybe<VideoPlayerInterface>;
}

export class VideoPlayer extends React.Component<
  VideoPlayerProps,
  VideoPlayerState
> {
  videoNodeRef: Nullable<HTMLVideoElement> = null;

  constructor(props: VideoPlayerProps) {
    super(props);

    this.state = { player: undefined };
  }

  /**
   * Initialize the `Plyr` video player and our adaptive bitrate library if applicable.
   * Noop out if the video or jwt is missing, render will redirect to an error page.
   */
  componentDidMount() {
    const { video, jwt, getTimedTextTrackList } = this.props;

    if (video) {
      getTimedTextTrackList();
      // Instantiate Plyr and keep the instance in state
      this.setState({
        player: this.props.createPlayer('plyr', this.videoNodeRef!, jwt),
      });

      // defaultBandwidthEstimate: 1600000,

      const dash = MediaPlayer().create();
      dash.initialize(this.videoNodeRef!, video.urls.manifests.dash, false);
      dash.setInitialBitrateFor('video', 1600000);
    }
  }

  /**
   * Make sure to destroy the player on unmount.
   */
  componentWillUnmount() {
    if (this.state.player) {
      this.state.player.destroy();
    }
  }

  render() {
    const { video, timedtexttracks } = this.props;

    // The video is somehow missing and jwt must be set
    if (!video) {
      return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
    }

    return (
      <video ref={node => (this.videoNodeRef = node)} crossOrigin="anonymous">
        <source
          src={video.urls.manifests.hls}
          size="auto"
          type="application/vnd.apple.mpegURL"
        />
        {(Object.keys(video.urls.mp4) as videoSize[]).map(size => (
          <source
            key={video.urls.mp4[size]}
            size={size}
            src={video.urls.mp4[size]}
            type="video/mp4"
          />
        ))}

        {timedtexttracks.objects
          .filter(track => track.is_ready_to_play)
          .filter(track =>
            [timedTextMode.CLOSED_CAPTIONING, timedTextMode.SUBTITLE].includes(
              track.mode,
            ),
          )
          .map(track => (
            <track
              key={track.id}
              src={track.url}
              srcLang={track.language}
              kind={trackTextKind[track.mode]}
              label={track.language}
            />
          ))}
      </video>
    );
  }
}

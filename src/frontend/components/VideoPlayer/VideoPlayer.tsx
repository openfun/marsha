import 'plyr/dist/plyr.css';
import * as React from 'react';
import { Redirect } from 'react-router';
import shaka from 'shaka-player';

import { createPlayer } from '../../Player/createPlayer';
import { Video, videoSize } from '../../types/tracks';
import { VideoPlayerInterface } from '../../types/VideoPlayerInterface';
import { Maybe, Nullable } from '../../utils/types';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import './VideoPlayer.css'; // Improve some plyr styles

export interface VideoPlayerProps {
  jwt: Nullable<string>;
  video: Nullable<Video>;
  createPlayer: typeof createPlayer;
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
    const { video, jwt } = this.props;

    if (video && jwt) {
      // Instantiate Plyr and keep the instance in state
      this.setState({
        player: this.props.createPlayer('plyr', this.videoNodeRef!, jwt),
      });

      // Use Shaka Player to stream using DASH ISO if the browser supports it
      // Otherwise we'll fall back to HLS/MP4 as described in the <sources> of the <video> element
      if (shaka.Player.isBrowserSupported()) {
        // Install any necessary polyfills from the shaka package
        shaka.polyfill.installAll();
        // Instantiate the player, passing our <video> element
        const shakaInstance = new shaka.Player(this.videoNodeRef!);
        shakaInstance.configure({
          abr: {
            // Set a more sensible default bandwidth
            // This lets us start with 480p instead of 144p with the default value
            defaultBandwidthEstimate: 1600000,
          },
        });
        // Pass our DASH manifest to Shaka
        shakaInstance.load(video.urls.manifests.dash);
      }
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
    const { video, jwt } = this.props;

    // The video is somehow missing and jwt must be set
    if (!video || !jwt) {
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
      </video>
    );
  }
}

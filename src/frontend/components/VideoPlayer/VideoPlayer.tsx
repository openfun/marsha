import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import * as React from 'react';
import { Redirect } from 'react-router';
import shaka from 'shaka-player';

import { Video, videoSize } from '../../types/tracks';
import { Maybe, Nullable } from '../../utils/types';
import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
import './VideoPlayer.css'; // Improve some plyr styles

export interface VideoPlayerProps {
  video: Nullable<Video>;
}

interface VideoPlayerState {
  player: Maybe<Plyr>;
}

export const ROUTE = () => '/player';

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
   * Noop out if the video is missing, render will redirect to an error page.
   */
  componentDidMount() {
    const { video } = this.props;

    if (video) {
      // Instantiate Plyr and keep the instance in state
      this.setState({ player: new Plyr(this.videoNodeRef!) });

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
    const { video } = this.props;

    // The video is somehow missing
    if (!video) {
      return <Redirect push to={ERROR_ROUTE('notFound')} />;
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

import * as React from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.min.css';

import { Video, videoSize } from '../../types/Video';
import { Nullable } from '../../utils/types';

export interface VideoJsPlayerProps extends videojs.PlayerOptions {
  video: Video;
}

interface VideoJsPlayerState {
  player: videojs.Player;
  videoNode: Nullable<HTMLVideoElement>;
}

export const ROUTE = () => '/player';

export class VideoJsPlayer extends React.Component<
  VideoJsPlayerProps,
  VideoJsPlayerState
> {
  videoNodeRef: Nullable<HTMLVideoElement> = null;

  componentDidMount() {
    // Instantiate Video.js and keep the instance in state
    this.setState({
      player: videojs(this.videoNodeRef, this.props),
    });
  }

  componentWillUnmount() {
    // Destroy player on unmount
    if (this.state.player) {
      this.state.player.dispose();
    }
  }

  render() {
    const { video } = this.props;

    // Wrap the player in a div with a `data-vjs-player` attribute so videojs won't create an additional
    // wrapper in the DOM; see https://github.com/videojs/video.js/pull/3856
    return (
      <div data-vjs-player>
        <video
          ref={node => (this.videoNodeRef = node)}
          className="video-js"
          controls={true}
        >
          {(Object.keys(video.urls.mp4) as videoSize[]).map(size => (
            <source
              src={video.urls.mp4[size]}
              type="video/mp4"
              key={video.urls.mp4[size]}
            />
          ))}
        </video>
      </div>
    );
  }
}

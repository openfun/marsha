import React from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.min.css';

import { Nullable } from '../../utils/types';

// tslint:disable-next-line:no-empty-interface
export interface VideoJsPlayerProps extends videojs.PlayerOptions {}

interface VideoJsPlayerState {
  player: videojs.Player;
  videoNode: Nullable<HTMLVideoElement>;
}

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
    // Wrap the player in a div with a `data-vjs-player` attribute so videojs won't create an additional
    // wrapper in the DOM; see https://github.com/videojs/video.js/pull/3856
    return (
      <div data-vjs-player>
        <video
          ref={node => (this.videoNodeRef = node)}
          className="video-js"
          controls={true}
        >
          <source src="/static/vid/video.mp4" type="video/mp4" />
        </video>
      </div>
    );
  }
}

import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import * as React from 'react';

import { Video, videoSize } from '../../types/Video';
import { Maybe, Nullable } from '../../utils/types';
import './VideoPlayer.css'; // Improve some plyr styles

interface VideoPlayerProps {
  video: Video;
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

  componentDidMount() {
    // Instantiate Plyr and keep the instance in state
    this.setState({ player: new Plyr(this.videoNodeRef!) });
  }

  componentWillUnmount() {
    // Make sure to destroy player on unmount
    if (this.state.player) {
      this.state.player.destroy();
    }
  }

  render() {
    const { video } = this.props;
    return (
      <video ref={node => (this.videoNodeRef = node)} crossOrigin="anonymous">
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

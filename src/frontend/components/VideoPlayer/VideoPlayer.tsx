import { MediaPlayer } from 'dashjs';
import { Box } from 'grommet';
import 'plyr/dist/plyr.css';
import * as React from 'react';
import { Redirect } from 'react-router';
import { Dispatch } from 'redux';

import { createPlayer } from '../../Player/createPlayer';
import { ConsumableQuery } from '../../types/api';
import { LanguageChoice } from '../../types/LanguageChoice';
import {
  TimedText,
  timedTextMode,
  TimedTextTranscript,
  Video,
  videoSize,
} from '../../types/tracks';
import { VideoPlayerInterface } from '../../types/VideoPlayerInterface';
import { isMSESupported } from '../../utils/isAbrSupported';
import { Maybe, Nullable } from '../../utils/types';
import { DownloadVideo } from '../DowloadVideo/DownloadVideo';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { TranscriptsConnected } from '../TranscriptsConnected/TranscriptsConnected';
import './VideoPlayer.css'; // Improve some plyr styles

const trackTextKind: { [key in timedTextMode]?: string } = {
  [timedTextMode.CLOSED_CAPTIONING]: 'captions',
  [timedTextMode.SUBTITLE]: 'subtitles',
};

export interface VideoPlayerProps {
  createPlayer: typeof createPlayer;
  dispatch: Dispatch;
  getTimedTextTrackLanguageChoices: (jwt: string) => void;
  jwt: string;
  languageChoices: LanguageChoice[];
  timedtexttracks: ConsumableQuery<TimedText>;
  video: Nullable<Video>;
}

interface VideoPlayerState {
  isDashSupported: boolean;
  player: Maybe<VideoPlayerInterface>;
}

export class VideoPlayer extends React.Component<
  VideoPlayerProps,
  VideoPlayerState
> {
  videoNodeRef: Nullable<HTMLVideoElement> = null;

  constructor(props: VideoPlayerProps) {
    super(props);
    this.state = {
      isDashSupported: isMSESupported(),
      player: undefined,
    };
  }

  /**
   * Initialize the `Plyr` video player and our adaptive bitrate library if applicable.
   * Noop out if the video or jwt is missing, render will redirect to an error page.
   */
  componentDidMount() {
    const {
      dispatch,
      video,
      jwt,
      getTimedTextTrackLanguageChoices,
    } = this.props;

    getTimedTextTrackLanguageChoices(jwt);

    if (video) {
      // Instantiate Plyr and keep the instance in state
      this.setState({
        player: this.props.createPlayer(
          'plyr',
          this.videoNodeRef!,
          jwt,
          dispatch,
        ),
      });

      if (this.state.isDashSupported) {
        const dash = MediaPlayer().create();
        dash.initialize(this.videoNodeRef!, video.urls.manifests.dash, false);
        dash.setInitialBitrateFor('video', 1600000);
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
    const { video, timedtexttracks, languageChoices } = this.props;

    const languages: { [key: string]: string } = languageChoices.reduce(
      (acc, current) => ({
        ...acc,
        [current.value]: current.label,
      }),
      {},
    );

    // The video is somehow missing and jwt must be set
    if (!video) {
      return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
    }

    const transcripts = timedtexttracks.objects
      .filter(track => track.is_ready_to_play)
      .filter(track => timedTextMode.TRANSCRIPT === track.mode);

    return (
      <Box>
        <video
          ref={node => (this.videoNodeRef = node)}
          crossOrigin="anonymous"
          poster={video.urls.thumbnails[720]}
        >
          {!this.state.isDashSupported &&
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
          {this.state.player &&
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
          <TranscriptsConnected
            transcripts={transcripts as TimedTextTranscript[]}
          />
        )}
      </Box>
    );
  }
}

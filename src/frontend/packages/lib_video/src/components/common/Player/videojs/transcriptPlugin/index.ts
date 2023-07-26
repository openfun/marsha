import {
  TimedTextTranscript,
  timedTextMode,
  useTimedTextTrack,
} from 'lib-components';
import videojs from 'video.js';

import './components/TranscriptButton';
import './components/TranscriptItem';
import { useTranscriptTimeSelector } from '@lib-video/hooks/useTranscriptTimeSelector';

import { TranscriptPluginOptions } from './types';

const Plugin = videojs.getPlugin('plugin');

export class TranscriptPlugin extends Plugin {
  unsubscribeTranscriptTimeSelector: () => void;

  constructor(player: videojs.Player, options: TranscriptPluginOptions) {
    super(player);
    const { video } = options;
    const timedTextTracks = useTimedTextTrack.getState().getTimedTextTracks();

    const transcripts = !video.is_live
      ? (timedTextTracks
          .filter((track) => track.is_ready_to_show)
          .filter((track) =>
            video.has_transcript === false &&
            video.should_use_subtitle_as_transcript
              ? timedTextMode.SUBTITLE === track.mode
              : timedTextMode.TRANSCRIPT === track.mode,
          ) as TimedTextTranscript[])
      : [];

    this.unsubscribeTranscriptTimeSelector =
      useTranscriptTimeSelector.subscribe(
        (state) => state.time,
        (time) => player.currentTime(time),
      );

    const controlBar = this.player.controlBar;
    const descriptionButton = controlBar.getChild('DescriptionsButton')?.el();
    controlBar.el().insertBefore(
      controlBar
        .addChild('TranscriptButton', {
          transcripts: transcripts,
        })
        .el(),
      descriptionButton || null,
    );

    player.on('dispose', this.handleDispose.bind(this));
  }

  handleDispose() {
    this.unsubscribeTranscriptTimeSelector();
  }
}

videojs.registerPlugin('transcriptPlugin', TranscriptPlugin);

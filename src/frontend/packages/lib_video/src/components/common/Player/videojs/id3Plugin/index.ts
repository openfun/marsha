import { Id3VideoType, useVideo } from 'lib-components';
import videojs, { Player } from 'video.js';

import { id3PluginType } from './type';

type Id3MessageType = {
  video: Id3VideoType;
};

const PluginClass = videojs.getPlugin('plugin') as id3PluginType;

export class id3Plugin extends PluginClass {
  lastReceivedVideo: Id3VideoType | undefined;
  videoState;
  declare player: Player;

  constructor(player: Player, options: unknown) {
    super(player, options);

    this.videoState = useVideo.getState();
    this.videoState.setIsWatchingVideo(true);

    this.player.on('loadedmetadata', this.handleLoadedMetadata.bind(this));

    this.player.on('play', this.handleStart.bind(this));

    this.player.on('ended', this.handleEnded.bind(this));

    this.player.on('dispose', this.handleDispose.bind(this));
  }

  handleLoadedMetadata() {
    const tracks = this.player.textTracks();
    for (let index = 0; index < tracks.length; index++) {
      const track = tracks[index];
      if (track.label === 'Timed Metadata') {
        track.addEventListener('cuechange', () => {
          // VTTCue normally doesn't have value property
          // Nonetheless, value is set when cue comes from id3 tags
          // and has a property key: "TXXX" in it
          const cue = track.activeCues?.[0] as
            | { value: { key: string } | undefined; text: string }
            | undefined;
          if (cue) {
            if (cue.value?.key !== 'PRIV') {
              // cue.text should be a video object
              const data = JSON.parse(cue.text) as Id3MessageType;
              if (
                data &&
                useVideo.getState().isWatchingVideo &&
                JSON.stringify(data.video) !==
                  JSON.stringify(this.lastReceivedVideo)
              ) {
                this.lastReceivedVideo = data.video;
                this.videoState.setId3Video(data.video);
              }
            }
          }
        });
      }
    }
  }

  handleStart() {
    if (!useVideo.getState().isWatchingVideo) {
      this.videoState.setIsWatchingVideo(true);
    }
  }

  handleEnded() {
    this.videoState.setId3Video(null);
    this.videoState.setIsWatchingVideo(false);
  }

  handleDispose() {
    this.videoState.setId3Video(null);
    this.videoState.setIsWatchingVideo(false);
  }
}

videojs.registerPlugin('id3Plugin', id3Plugin);

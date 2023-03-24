import { Maybe } from 'lib-common';
import videojs from 'video.js';

import { VideoJsExtendedSourceObject } from '@lib-video/types/libs/video.js/extend';

import { Events } from './types';

videojs.use('video/mp4', (player: videojs.Player) => ({
  setSource: (playerSource, next) => {
    const sources = player.currentSources();

    let selectedSource: Maybe<VideoJsExtendedSourceObject>;

    selectedSource = sources.find((source) => source.selected);

    if (!selectedSource && player.videojs_quality_selector_plugin_default) {
      selectedSource = sources.find(
        (source) =>
          source.size === player.videojs_quality_selector_plugin_default,
      );
    }

    player.trigger(Events.PLAYER_SOURCES_CHANGED);

    next(null, selectedSource || playerSource);
  },
}));

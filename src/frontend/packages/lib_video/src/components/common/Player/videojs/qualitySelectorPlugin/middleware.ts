import { Maybe } from 'lib-common';
import videojs, { MiddlewareUse, Player, Source } from 'video.js';

import { Events } from './types';

(videojs.use as typeof MiddlewareUse)('video/mp4', (player: Player) => ({
  setSource: (playerSource, next) => {
    const sources = player.currentSources();

    let selectedSource: Maybe<Source>;

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

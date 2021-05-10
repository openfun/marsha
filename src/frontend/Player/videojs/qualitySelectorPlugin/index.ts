import videojs from 'video.js';

import { QualitySelectorMenuButton } from './components/QualitySelectorMenuButton';
import { QualitySelectorMenuItem } from './components/QualitySelectorMenuItem';
import {
  Events,
  QualitySelectorOptions,
  QualitySelectorMenuItemOptions,
} from './types';
import './middleware';

const Plugin = videojs.getPlugin('plugin');

export class QualitySelector extends Plugin {
  constructor(player: videojs.Player, options?: QualitySelectorOptions) {
    super(player, options);

    videojs.registerComponent(
      'QualitySelectorMenuButton',
      QualitySelectorMenuButton,
    );
    videojs.registerComponent(
      'QualitySelectorMenuItem',
      QualitySelectorMenuItem,
    );
    if (options?.default) {
      player.videojs_quality_selector_plugin_default = options.default;
    }

    this.on(player, 'loadedmetadata', this.initPlugin);
    this.on(player, Events.QUALITY_REQUESTED, this.changeQuality);
    this.on(player, Events.PLAYER_SOURCES_CHANGED, this.sourcesChanged);
  }

  private initPlugin() {
    if (this.player.videojs_quality_selector_plugin_initialized) {
      return;
    }
    const controlBar = this.player.controlBar;
    const fullscreenToggle = controlBar.getChild('fullscreenToggle')?.el();
    controlBar
      .el()
      .insertBefore(
        controlBar.addChild('QualitySelectorMenuButton').el(),
        fullscreenToggle || null,
      );
    this.player.videojs_quality_selector_plugin_initialized = true;
  }

  private changeQuality(
    event: Events,
    selectedSource: QualitySelectorMenuItemOptions,
  ) {
    const sources = this.player.currentSources();
    this.player.videojs_quality_selector_plugin_is_paused =
      this.player.paused();
    this.player.videojs_quality_selector_plugin_currentime =
      this.player.currentTime();

    const newSources = sources.map((source) => {
      source.selected = source.src === selectedSource.src;

      return source;
    });

    this.player.src(newSources);
  }

  private sourcesChanged() {
    if (this.player.videojs_quality_selector_plugin_currentime) {
      this.player.currentTime(
        this.player.videojs_quality_selector_plugin_currentime,
      );
    }

    if (!this.player.videojs_quality_selector_plugin_is_paused) {
      this.player.play();
    }

    this.player.videojs_quality_selector_plugin_currentime = undefined;
    this.player.videojs_quality_selector_plugin_is_paused = undefined;
  }
}

videojs.registerPlugin('qualitySelector', QualitySelector);

import videojs, { Player } from 'video.js';
import Component from 'video.js/dist/types/component';
import Plugin from 'video.js/dist/types/plugin';

import { QualitySelectorMenuButton } from './components/QualitySelectorMenuButton';
import { QualitySelectorMenuItem } from './components/QualitySelectorMenuItem';
import {
  Events,
  QualitySelectorMenuItemOptions,
  QualitySelectorOptions,
} from './types';

import './middleware';

const PluginClass = videojs.getPlugin('plugin') as typeof Plugin;

export class QualitySelector extends PluginClass {
  constructor(player: Player, options?: QualitySelectorOptions) {
    super(player);

    videojs.registerComponent(
      'QualitySelectorMenuButton',
      QualitySelectorMenuButton as unknown as Component,
    );
    videojs.registerComponent(
      'QualitySelectorMenuItem',
      QualitySelectorMenuItem as unknown as Component,
    );
    if (options?.default) {
      player.videojs_quality_selector_plugin_default = options.default;
    }

    this.player.on('loadedmetadata', this.initPlugin.bind(this));
    this.player.on(Events.QUALITY_REQUESTED, this.changeQuality.bind(this));
    this.player.on(
      Events.PLAYER_SOURCES_CHANGED,
      this.sourcesChanged.bind(this),
    );
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
    _event: Events,
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

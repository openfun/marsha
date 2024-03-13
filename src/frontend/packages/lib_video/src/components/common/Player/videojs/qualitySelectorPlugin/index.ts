import videojs, { Player } from 'video.js';
import Component from 'video.js/dist/types/component';

import { QualitySelectorMenuButton } from './components/QualitySelectorMenuButton';
import {
  Events,
  QualitySelectorMenuItemOptions,
  QualitySelectorOptions,
  QualitySelectorType,
} from './types';
import './middleware';

const PluginClass = videojs.getPlugin('plugin') as QualitySelectorType;

export class QualitySelector extends PluginClass {
  declare player: Player;

  constructor(player: Player, options?: QualitySelectorOptions) {
    super(player, options);

    videojs.registerComponent(
      'QualitySelectorMenuButton',
      QualitySelectorMenuButton as unknown as typeof Component,
    );

    if (options?.default) {
      this.player.videojs_quality_selector_plugin_default = options.default;
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
    this.player.videojs_quality_selector_plugin_is_paused =
      this.player.paused();

    this.player.videojs_quality_selector_plugin_currentime =
      this.player.currentTime();

    const { sources } = this.player.options_;
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

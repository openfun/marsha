import 'video.js';
import { Engine } from 'p2p-media-loader-hlsjs';

import { DownloadVideoPluginOptions } from '../../../components/common/Player/videojs/downloadVideoPlugin/types';

declare module 'video.js' {
  interface VideoJsPlayerOptions {
    debug?: boolean;
    responsive?: boolean;
  }

  interface VideoJsPlayerPluginOptions {
    httpSourceSelector?: VideoJsHttpSourceSelectorPluginOptions;
    qualitySelector?: QualitySelectorOptions;
  }

  interface VideoJsPlayer {
    // videojs-quality-selector-plugin
    videojs_quality_selector_plugin_initialized: boolean;
    videojs_quality_selector_plugin_is_paused?: boolean;
    videojs_quality_selector_plugin_currentime?: number;
    videojs_quality_selector_plugin_default?: string;
    cache_: {
      initTime: number;
    };
    // p2p-media-loader-hlsjs
    config: { loader: { getEngine: () => Engine } };
    media: { currentTime: number };
    downloadVideoPlugin: (options: DownloadVideoPluginOptions) => void;
    p2pHlsPlugin: () => void;
    id3Plugin: () => void;
    // videojs-http-source-selector
    httpSourceSelector: () => void;
    qualitySelector: () => {
      on(
        type?: string | string[],
        listener?: (...args: unknown[]) => void,
      ): void;
    };
    qualityLevels: () => QualityLevels;
    currentSources(): VideoJsExtendedSourceObject[];
    currentSource(): VideoJsExtendedSourceObject;
  }
}

interface QualityLevels {
  [index: number]: VideoJsQualityLevelsPluginRepresentation;
  length: number;
  selectedIndex: number;
  on: (
    event: 'change' | 'addqualitylevel' | 'removequalitylevel',
    action: () => void,
  ) => void;
  trigger: (event: string) => void;
}

interface VideoJsExtendedSourceObject {
  src: string;
  type?: string;
  size?: string;
  selected?: boolean;
}

interface VideoJsHttpSourceSelectorPluginOptions {
  default: 'low' | 'high' | 'auto';
}

interface VideoJsQualityLevelsPluginRepresentation {
  id: string;
  width: number;
  height: number;
  bitrate: number;
  /*
    Callback to enable/disable QualityLevel
  */
  enabled: () => boolean;
}

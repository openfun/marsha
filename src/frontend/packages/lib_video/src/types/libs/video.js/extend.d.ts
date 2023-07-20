import 'video.js';
import PlayerInit from 'video.js/dist/types/player';
import Tech from 'video.js/dist/types/tech/tech';

import { DownloadVideoPluginOptions } from '../../../components/common/Player/videojs/downloadVideoPlugin/types';
import { XapiPluginOptions } from '../../../components/common/Player/videojs/xapiPlugin/types';

declare module 'video.js' {
  type VideoJsPlayerOptions = PlayerInit.options_ & {
    autoplay?: boolean;
    controls?: boolean;
    fluid?: boolean;
    debug?: boolean;
    responsive?: boolean;
    html5: {
      vhs?: {
        limitRenditionByPlayerDimensions?: boolean;
        overrideNative?: boolean;
        useDevicePixelRatio?: boolean;
      };
      nativeAudioTracks?: boolean;
      nativeVideoTracks?: boolean;
      hlsjsConfig?: {
        liveSyncDurationCount?: number;
        loader: Engine;
      };
    };
    language?: string;
    liveui?: boolean;
    plugins?: VideoJsPlayerPluginOptions;
    sources?: VideoJsExtendedSourceObject[];
  };

  interface VideoJsPlayerPluginOptions {
    httpSourceSelector?: VideoJsHttpSourceSelectorPluginOptions;
    qualitySelector?: QualitySelectorOptions;
  }

  interface Player extends PlayerInit {
    // videojs-quality-selector-plugin
    videojs_quality_selector_plugin_initialized: boolean;
    videojs_quality_selector_plugin_is_paused?: boolean;
    videojs_quality_selector_plugin_currentime?: number;
    videojs_quality_selector_plugin_default?: string;
    // p2p-media-loader-hlsjs
    config: { loader: { getEngine: () => Engine } };
    media: { currentTime: number };
    downloadVideoPlugin: (options: DownloadVideoPluginOptions) => void;
    p2pHlsPlugin: () => void;
    id3Plugin: () => void;
    xapiPlugin: (options: XapiPluginOptions) => void;
    // videojs-http-source-selector
    httpSourceSelector: () => void;
    qualitySelector: () => {
      on(
        type?: string | string[],
        listener?: (...args: unknown[]) => void,
      ): void;
    };
    qualityLevels: () => QualityLevels;
    currentSources(): Tech & VideoJsExtendedSourceObject[];
    currentSource(): Tech & VideoJsExtendedSourceObject;
    options_: VideoJsPlayerOptions;
  }

  export default function (
    id: string | Element,
    options?: VideoJsPlayerOptions,
    ready?: ReadyCallback,
  ): Player;
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

type VideoJsExtendedSourceObject = {
  src: string;
  type?: string;
  size?: string;
  selected?: boolean;
};

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

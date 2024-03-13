import { Engine } from 'p2p-media-loader-hlsjs';
import 'video.js';
import PlayerInit from 'video.js/dist/types/player';
import PluginInit from 'video.js/dist/types/plugin';
import Tech from 'video.js/dist/types/tech/tech';

import {
  DownloadVideoPluginOptions,
  SharedLiveMediaOptions,
  TranscriptButtonOptions,
  XapiPluginOptions,
} from '../../../components/common/Player/videojs/';

declare module 'video.js' {
  export function MiddlewareUse(
    type: string,
    middleware: (Player) => {
      setSource: (
        playerSource: Source,
        next: (err: Error | null, source: Source) => void,
      ) => void;
    },
  ): void;

  type PlayerOptionInit = typeof PlayerInit.prototype.options_;
  interface PlayerOption extends PlayerOptionInit {
    autoplay?: boolean;
    controls?: boolean;
    debug?: boolean;
    fluid?: boolean;
    sources: Source[];
    plugins?: Plugins;
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
  }

  export class Player extends PlayerInit {
    qualityLevels: () => QualityLevels;
    currentSources(): Tech & Source[];
    currentSource(): Tech & Source;
    videojs_quality_selector_plugin_default?: string;
    videojs_quality_selector_plugin_initialized?: boolean;
    videojs_quality_selector_plugin_is_paused?: boolean;
    videojs_quality_selector_plugin_currentime?: number;
    options_: PlayerOption;
    lastSource_: {
      player: string;
      tech: string;
    };
    controlBar: {
      el(): Element;
      addChild(
        name: string,
        option?:
          | DownloadVideoPluginOptions
          | SharedLiveMediaOptions
          | TranscriptButtonOptions,
      ): {
        el(): Element;
      };
      getChild(name: string): {
        el(): Element;
      };
      getDescendant(name: string): {
        el(): Element;
      };
    };
    p2pHlsPlugin: () => void;
    config: { loader: { getEngine: () => Engine } };
    media: { currentTime: number };
    downloadVideoPlugin: (options: DownloadVideoPluginOptions) => void;
    sharedMediaPlugin: (options: SharedLiveMediaOptions) => void;
    transcriptPlugin: (option: TranscriptPluginOptions) => void;
    httpSourceSelector: () => void;
    id3Plugin: () => void;
    textTracks: () => TextTrackList;
    xapiPlugin: (options: XapiPluginOptions) => void;
    remoteTextTracks: () => TextTrackList;
    seeking: () => boolean;
  }

  export interface Source {
    src: string;
    type?: string;
    size?: string;
    selected?: boolean;
  }

  export type Plugins = typeof PluginInit & {
    qualitySelector?: {
      default: string;
    };
  };
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

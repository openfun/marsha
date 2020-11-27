import 'video.js';

declare module 'video.js' {
  interface VideoJsPlayerOptions {
    debug?: boolean;
    responsive?: boolean;
  }

  interface VideoJsPlayerPluginOptions {
    httpSourceSelector?: VideoJsHttpSourceSelectorPluginOptions;
  }

  interface VideoJsPlayer {
    // videojs-http-source-selector
    httpSourceSelector: () => void;
    qualityLevels: () => {
      [index: number]: VideoJsQualityLevelsPluginRepresentation;
      lenght: number;
      selectedIndex: number;
      on: (
        event: 'change' | 'addqualitylevel' | 'removequalitylevel',
        action: () => void,
      ) => void;
      trigger: (event: string) => void;
    };
  }
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

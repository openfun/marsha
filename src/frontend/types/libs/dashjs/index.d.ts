export as namespace dashjs;
export = dashjs;

// tslint:disable-next-line:no-namespace
declare namespace dashjs {
  export interface MediaPlayerClass {
    initialize(view?: HTMLElement, source?: string, autoPlay?: boolean): void;
    setInitialBitrateFor(type: 'video' | 'audio', value: number): void;
  }

  export interface MediaPlayerFactory {
    create(): MediaPlayerClass;
  }

  export function MediaPlayer(): MediaPlayerFactory;
}

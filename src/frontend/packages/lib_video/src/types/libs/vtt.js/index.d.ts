/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'vtt.js' {
  export namespace WebVTT {
    export function StringDecoder(): TextDecoder;
    export function convertCueToDOMTree(
      window: Window,
      cuetext: string,
    ): HTMLDivElement;
    export function processCues(
      window: Window,
      cues: any[],
      overlay: HTMLElement,
    ): void;

    export class Parser {
      onflush: () => {};
      onparsingerror: (error: Error) => {};
      constructor(window: Window, stringDecoder: TextDecoder);
      parse(data: string): void;
      flush(): void;
      oncue(cue: VTTCue): void;
    }
  }

  export interface VTTCue {
    endTime: number;
    startTime: number;
    id: string;
    text: string;
  }
}

/* tslint:disable:no-namespace unified-signatures */
// Type definitions for plyr 3.4.3
// Project: https://github.com/sampotts/plyr
// Definitions by: Mehdi Benadda https://github.com/mbenadda

// Plyr is an UMD module, exposes a global variable Plyr when loaded outside a module loader
export as namespace Plyr;
export = Plyr;

// Module methods and properties
declare class Plyr {
  // TODO: add typing for the jQuery object constructor call
  constructor(cssStringSelector: string);
  constructor(videoElement: HTMLElement);
  constructor(nodeList: NodeList);

  /** Destroy the instance and garbage collect any elements. */
  destroy(): void;

  /** Pause playback. */
  pause(): void;

  /** Start playback.
   * @returns in *some* browsers, returns a Promise that is resolved when playback has started successfully.
   */
  play(): Promise<void> | void;

  /** Toggle playback, if no parameters are passed, it will toggle based on current status. */
  togglePlay(toggleTo?: boolean): void;
}

// Additional types from our Plyr typings
declare namespace Plyr {}

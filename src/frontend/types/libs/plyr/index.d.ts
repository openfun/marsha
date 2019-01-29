// Type definitions for plyr 3.3.15
// Definitions by: Michael Wagner <https://github.com/wagich>, tdaines <https://github.com/tdaines>

export as namespace Plyr;
export = Plyr;

declare class Plyr {
  static setup(
    targets: NodeList | HTMLElement | HTMLElement[] | string,
    options?: Plyr.Options,
  ): Plyr[];

  /**
   * Check for support
   * @param mediaType
   * @param provider
   * @param playsInline Whether the player has the playsinline attribute (only applicable to iOS 10+)
   */
  static supported(
    mediaType?: Plyr.MediaType,
    provider?: Plyr.Provider,
    playsInline?: boolean,
  ): Plyr.Support;

  /**
   * Indicates if the current player is HTML5.
   */
  readonly isHTML5: boolean;

  /**
   * Indicates if the current player is an embedded player.
   */
  readonly isEmbed: boolean;

  /**
   * Indicates if the current player is playing.
   */
  readonly playing: boolean;

  /**
   * Indicates if the current player is paused.
   */
  readonly paused: boolean;

  /**
   * Indicates if the current player is stopped.
   */
  readonly stopped: boolean;

  /**
   * Indicates if the current player has finished playback.
   */
  readonly ended: boolean;

  /**
   * Returns a float between 0 and 1 indicating how much of the media is buffered
   */
  readonly buffered: number;

  /**
   * Gets or sets the currentTime for the player. The setter accepts a float in seconds.
   */
  currentTime: number;

  /**
   * Indicates if the current player is seeking.
   */
  readonly seeking: boolean;

  /**
   * Returns the duration for the current media.
   */
  readonly duration: number;

  /**
   * Gets or sets the volume for the player. The setter accepts a float between 0 and 1.
   */
  volume: number;

  /**
   * Gets or sets the muted state of the player. The setter accepts a boolean.
   */
  muted: boolean;

  /**
   * Indicates if the current media has an audio track.
   */
  readonly hasAudio: boolean;

  /**
   * Gets or sets the speed for the player. The setter accepts a value in the options specified in your config.
   * Generally the minimum should be 0.5.
   */
  speed: number;

  /**
   * Gets or sets the quality for the player. The setter accepts a value from the options specified in your config.
   * Remarks: YouTube only. HTML5 will follow.
   */
  quality: string;

  /**
   * Gets or sets the current loop state of the player.
   */
  loop: boolean;

  /**
   * Gets or sets the current source for the player.
   */
  source: Plyr.SourceInfo;

  /**
   * Gets or sets the current poster image URL for the player.
   */
  poster: string;

  /**
   * Gets or sets the autoplay state of the player.
   */
  autoplay: boolean;

  /**
   * Gets or sets the caption track by index. -1 means the track is missing or captions is not active
   */
  currentTrack: number;

  /**
   * Gets or sets the preferred captions language for the player. The setter accepts an ISO twoletter language code.
   * Support for the languages is dependent on the captions you include.
   * If your captions don't have any language data, or if you have multiple tracks with the same language,
   * you may want to use currentTrack instead.
   */
  language: string;

  /**
   * Gets or sets the picture-in-picture state of the player.
   * This currently only supported on Safari 10+ on MacOS Sierra+ and iOS 10+.
   */
  pip: boolean;

  readonly fullscreen: Plyr.FullscreenControl;

  constructor(
    targets: NodeList | HTMLElement | HTMLElement[] | string,
    options?: Plyr.Options,
  );

  /** Destroy the instance and garbage collect any elements. */
  destroy(): void;

  /**
   * Start playback.
   * For HTML5 players, will return a Promise in some browsers. WebKit and Mozilla according to MDN at time of writing.
   */
  play(): Promise<void> | void;

  /**
   * Pause playback.
   */
  pause(): void;

  /**
   * Toggle playback, if no parameters are passed, it will toggle based on current status.
   */
  togglePlay(toggle?: boolean): boolean;

  /**
   * Stop playback and reset to start.
   */
  stop(): void;

  /**
   * Restart playback.
   */
  restart(): void;

  /**
   * Rewind playback by the specified seek time. If no parameter is passed, the default seek time will be used.
   */
  rewind(seekTime?: number): void;

  /**
   * Fast forward by the specified seek time. If no parameter is passed, the default seek time will be used.
   */
  forward(seekTime?: number): void;

  /**
   * Increase volume by the specified step. If no parameter is passed, the default step will be used.
   */
  increaseVolume(step?: number): void;

  /**
   * Increase volume by the specified step. If no parameter is passed, the default step will be used.
   */
  decreaseVolume(step?: number): void;

  /**
   * Toggle captions display. If no parameter is passed, it will toggle based on current status.
   */
  toggleCaptions(toggle?: boolean): void;

  /**
   * Trigger the airplay dialog on supported devices.
   */
  airplay(): void;

  /**
   * Toggle the controls (video only). Takes optional truthy value to force it on/off.
   */
  toggleControls(toggle: boolean): void;

  /**
   * Add an event listener for the specified event.
   */
  on(
    event: Plyr.StandardEvent | Plyr.Html5Event | Plyr.YoutubeEvent,
    callback: (this: this, event: Plyr.PlyrEvent) => void,
  ): void;

  /**
   * Add an event listener for the specified event once.
   */
  once(
    event: Plyr.StandardEvent | Plyr.Html5Event | Plyr.YoutubeEvent,
    callback: (this: this, event: Plyr.PlyrEvent) => void,
  ): void;

  /**
   * Remove an event listener for the specified event.
   */
  off(
    event: Plyr.StandardEvent | Plyr.Html5Event | Plyr.YoutubeEvent,
    callback: (this: this, event: Plyr.PlyrEvent) => void,
  ): void;

  /**
   * Check support for a mime type.
   */
  supports(type: string): boolean;
}

// tslint:disable-next-line:no-namespace
declare namespace Plyr {
  export type MediaType = 'audio' | 'video';
  export type Provider = 'html5' | 'youtube' | 'vimeo';
  export type StandardEvent =
    | 'progress'
    | 'playing'
    | 'play'
    | 'pause'
    | 'timeupdate'
    | 'volumechange'
    | 'seeking'
    | 'seeked'
    | 'ratechange'
    | 'ended'
    | 'enterfullscreen'
    | 'exitfullscreen'
    | 'captionsenabled'
    | 'captionsdisabled'
    | 'languagechange'
    | 'controlshidden'
    | 'controlsshown'
    | 'ready';
  export type Html5Event =
    | 'loadstart'
    | 'loadeddata'
    | 'loadedmetadata'
    | 'canplay'
    | 'canplaythrough'
    | 'stalled'
    | 'waiting'
    | 'emptied'
    | 'cuechange'
    | 'error';
  export type YoutubeEvent =
    | 'statechange'
    | 'qualitychange'
    | 'qualityrequested';

  export interface FullscreenControl {
    /**
     * Indicates if the current player is in fullscreen mode.
     */
    readonly active: boolean;

    /**
     * Indicates if the current player has fullscreen enabled.
     */
    readonly enabled: boolean;

    /**
     * Enter fullscreen. If fullscreen is not supported, a fallback ""full window/viewport"" is used instead.
     */
    enter(): void;

    /**
     * Exit fullscreen.
     */
    exit(): void;

    /**
     * Toggle fullscreen.
     */
    toggle(): void;
  }

  export interface Options {
    /**
     * Completely disable Plyr.
     */
    enabled?: boolean;

    /**
     * Display debugging information in the console
     */
    debug?: boolean;

    /**
     * If a function is passed, it is assumed your method will return either an element or HTML string for the controls
     * Three arguments will be passed to your function; id (the unique id for the player),
     * seektime (the seektime step in seconds), and title (the media title).
     * Defaults to ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions',
     *              'settings', 'pip', 'airplay', 'fullscreen']
     */
    // tslint:disable-next-line:ban-types
    controls?: string[] | Function | Element;

    /**
     * If you're using the default controls are used then you can specify which settings to show in the menu
     * Defaults to ['captions', 'quality', 'speed', 'loop']
     */
    settings?: string[];

    /**
     * Used for internationalization (i18n) of the text within the UI.
     */
    i18n?: any;

    /**
     * Load the SVG sprite specified as the iconUrl option (if a URL).
     * If false, it is assumed you are handling sprite loading yourself.
     */
    loadSprite?: boolean;

    /**
     * Specify a URL or path to the SVG sprite. See the SVG section for more info.
     */
    iconUrl?: string;

    /**
     * Specify the id prefix for the icons used in the default controls (e.g. plyr-play would be plyr).
     * This is to prevent clashes if you're using your own SVG sprite but with the default controls.
     * Most people can ignore this option.
     */
    iconPrefix?: string;

    /**
     * Specify a URL or path to a blank video file used to properly cancel network requests.
     */
    blankUrl?: string;

    /**
     * Autoplay the media on load. This is generally advised against on UX grounds.
     * It is also disabled by default in some browsers.
     * If the autoplay attribute is present on a <video> or <audio> element, this will be automatically set to true.
     */
    autoplay?: boolean;

    /**
     * Only allow one player playing at once.
     */
    autopause?: boolean;

    /**
     * The time, in seconds, to seek when a user hits fast forward or rewind.
     */
    seekTime?: number;

    /**
     * A number, between 0 and 1, representing the initial volume of the player.
     */
    volume?: number;

    /**
     * Whether to start playback muted.
     * If the muted attribute is present on a <video> or <audio> element, this will be automatically set to true.
     */
    muted?: boolean;

    /**
     * Click (or tap) of the video container will toggle play/pause.
     */
    clickToPlay?: boolean;

    /**
     * Disable right click menu on video to help as very primitive obfuscation to prevent downloads of content.
     */
    disableContextMenu?: boolean;

    /**
     * Hide video controls automatically after 2s of no mouse or focus movement,
     * on control element blur (tab out), on playback start or entering fullscreen. As soon as the mouse is moved,
     * a control element is focused or playback is paused, the controls reappear instantly.
     */
    hideControls?: boolean;

    /**
     * Reset the playback to the start once playback is complete.
     */
    resetOnEnd?: boolean;

    /**
     * Enable keyboard shortcuts for focused players only or globally
     */
    keyboard?: KeyboardOptions;

    /**
     * controls: Display control labels as tooltips on :hover & :focus (by default, the labels are screen reader only).
     * seek: Display a seek tooltip to indicate on click where the media would seek to.
     */
    tooltips?: TooltipOptions;

    /**
     * Specify a custom duration for media.
     */
    duration?: number;

    /**
     * Displays the duration of the media on the metadataloaded event (on startup) in the current time display.
     * This will only work if the preload attribute is not set to none (or is not set at all)
     * and you choose not to display the duration (see controls option).
     */
    displayDuration?: boolean;

    /**
     * Display the current time as a countdown rather than an incremental counter.
     */
    invertTime?: boolean;

    /**
     * Allow users to click to toggle the above.
     */
    toggleInvert?: boolean;

    /**
     * Allows binding of event listeners to the controls before the default handlers.
     * See the defaults.js for available listeners.
     * If your handler prevents default on the event (event.preventDefault()), the default handler will not fire.
     */
    listeners?: object;

    /**
     * active: Toggles if captions should be active by default.
     * language: Sets the default language to load (if available). 'auto' uses the browser language.
     * update: Listen to changes to tracks and update menu. This is needed for some streaming libraries,
     *  but can result in unselectable language options).
     */
    captions?: CaptionOptions;

    /**
     * enabled: Toggles whether fullscreen should be enabled.
     * fallback: Allow fallback to a full-window solution.
     * iosNative: whether to use native iOS fullscreen when entering fullscreen (no custom controls)
     */
    fullscreen?: FullScreenOptions;

    /**
     * The aspect ratio you want to use for embedded players.
     */
    ratio?: string;

    /**
     * enabled: Allow use of local storage to store user settings. key: The key name to use.
     */
    storage?: StorageOptions;

    /**
     * selected: The default speed for playback.
     * options: Options to display in the menu. Most browsers will refuse to play slower than 0.5.
     */
    speed?: SpeedOptions;

    /**
     * Currently only supported by YouTube.
     * default is the default quality level, determined by YouTube.
     * options are the options to display.
     */
    quality?: QualityOptions;

    /**
     * active: Whether to loop the current video.
     * If the loop attribute is present on a <video> or <audio> element,
     * this will be automatically set to true This is an object to support future functionality.
     */
    loop?: LoopOptions;

    /**
     * enabled: Whether to enable vi.ai ads. publisherId: Your unique vi.ai publisher ID.
     */
    ads?: AdOptions;
  }

  export interface QualityOptions {
    default: string;
    options: string[];
  }

  export interface LoopOptions {
    active: boolean;
  }

  export interface AdOptions {
    enabled: boolean;
    publisherId: string;
  }

  export interface SpeedOptions {
    selected: number;
    options: number[];
  }

  export interface KeyboardOptions {
    focused?: boolean;
    global?: boolean;
  }

  export interface TooltipOptions {
    controls?: boolean;
    seek?: boolean;
  }

  export interface FullScreenOptions {
    enabled?: boolean;
    fallback?: boolean;
    allowAudio?: boolean;
  }

  export interface CaptionOptions {
    defaultActive?: boolean;
  }

  export interface StorageOptions {
    enabled?: boolean;
    key?: string;
  }

  export interface SourceInfo {
    /**
     * Note: YouTube and Vimeo are currently not supported as audio sources.
     */
    type: MediaType;

    /**
     * Title of the new media.
     * Used for the aria-label attribute on the play button, and outer container.
     * YouTube and Vimeo are populated automatically.
     */
    title?: string;

    /**
     * This is an array of sources.
     * For HTML5 media, the properties of this object are mapped directly to HTML attributes
     * so more can be added to the object if required.
     */
    sources: Source[];

    /**
     * The URL for the poster image (HTML5 video only).
     */
    poster?: string;

    /**
     * An array of track objects.
     * Each element in the array is mapped directly to a track element and any keys mapped directly to HTML attributes
     * Booleans are converted to HTML5 value-less attributes.
     */
    tracks?: Track[];
  }

  export interface Source {
    /**
     * The URL of the media file (or YouTube/Vimeo URL).
     */
    src: string;
    /**
     * The MIME type of the media file (if HTML5).
     */
    type?: string;
    provider?: Provider;
  }

  export type TrackKind =
    | 'subtitles'
    | 'captions'
    | 'descriptions'
    | 'chapters'
    | 'metadata';
  export interface Track {
    /**
     * Indicates how the text track is meant to be used
     */
    kind: TrackKind;
    /**
     * Indicates a user-readable title for the track
     */
    label: string;
    /**
     * The language of the track text data.
     * It must be a valid BCP 47 language tag. If the kind attribute is set to subtitles, then srclang must be defined.
     */
    srcLang?: string;
    /**
     * The URL of the track (.vtt file).
     */
    src: string;

    default?: boolean;
  }

  export interface PlyrEvent extends CustomEvent {
    readonly detail: { readonly plyr: Plyr };
  }

  export interface Support {
    api: boolean;
    ui: boolean;
  }
}

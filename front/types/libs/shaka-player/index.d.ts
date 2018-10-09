/* tslint:disable:no-namespace unified-signatures, variable-name */
// Type definitions for shaka-player 2.5.0-beta
// Project: https://github.com/google/shaka-player
// Definitions by: Mehdi Benadda https://github.com/mbenadda

// shaka is imported through a module loader
export = shaka;

declare namespace shaka {
  class Player {
    /** STATIC FIELDS */

    /** A version number taken from git at compile time. */
    static version: string;

    /** STATIC METHODS */

    /** Whether the browser provides basic support. If this returns false, Shaka Player cannot be used at all.
     * In this case, do not construct a Player instance and do not use the library.
     * @returns the result of the browser support check.
     */
    static isBrowserSupported(): boolean;

    /** Probes the browser to determine what features are supported. This makes a number of requests to EME/MSE/etc
     * which may result in user prompts. This should only be used for diagnostics.
     * NOTE: This may show a request to the user for permission.
     * @returns a promise for the results of the support diagnostics.
     */
    // FIXME: shakaExtern reference
    static probeSupport(): Promise<any>;

    /** Registers a plugin callback that will be called with support().
     * The callback should return the value that will be stored in the return value from support().
     * @param name The name of the plugin for which support is checked.
     * @param callback The actual support check, returning the result of its tests.
     */
    static registerSupportPlugin(name: string, callback: () => unknown): void;

    /** INSTANCE METHODS */

    /** Instantiate a new player
     * @param video The video element on which to attach the player. If provided, this is equivalent to calling
     * attach(video, true) immediately after construction.
     * @param opt_dependencyInjector Optional callback which is called to inject mocks into the Player. Used
     * for testing.
     * @returns a new player instance.
     */
    constructor(
      video?: HTMLMediaElement,
      opt_dependencyInjector?: (this: shaka.Player) => void,
    );

    /** Configure the Player instance. The config object passed in need not be complete. It will be merged
     * with the existing Player configuration.
     *
     * Config keys and types will be checked. If any problems with the config object are found, errors will be
     * reported through logs and this returns false. If there are errors, valid config objects are still set.
     * @param config PlayerConfiguration object with the correct shape.
     * @returns whether the configuration object was 100% valid.
     */
    // FIXME: shakaExtern reference
    configure(config: any): boolean;
    /** Configure the Player instance. The config object passed in need not be complete. It will be merged
     * with the existing Player configuration.
     *
     * Config keys and types will be checked. If any problems with the config object are found, errors will be
     * reported through logs and this returns false. If there are errors, valid config objects are still set.
     * @param configKey A property name from the Configuration object.
     * @param value The value to assign to this property.
     * @returns whether the configuration object was 100% valid.
     */
    // FIXME: shakaExtern reference (configKey should be keyof PlayerConfiguration)
    // FIXME: shakaExtern reference (should support only sensible types on value through typeof)
    configure(configKey: string, value: any): boolean;

    /** Load a manifest.
     * @param manifestUri The URI for the manifest.
     * @param opt_startTime Optional start time, in seconds, to begin playback. Defaults to 0 for VOD and
     * to the live edge for live. Set a positive number to start with a certain offset from the beginning. Set a
     * negative number to start with a certain offset from the end. This is intended for use with live streams,
     * to start at a fixed offset from the live edge.
     * @param opt_manifestParserFactory Optional manifest parser factory to override auto-detection or
     * use an unregistered parser.
     */
    // FIXME: precise the return value
    load(
      manifestUri: string,
      opt_startTime?: number,
      opt_manifestParserFactory?: any,
    ): Promise<any>;
  }

  namespace polyfill {
    /** Install all polyfills. */
    const installAll: () => void;
  }
}

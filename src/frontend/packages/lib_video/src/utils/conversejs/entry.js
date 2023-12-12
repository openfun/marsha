// This file comes from converse.js github repository
// This is the entrypoint to load converse headless
// and then use it from window.converse
// We keep this file in javascript and not in typescript
// to ease its update from the converse.js repo.
// source: https://github.com/conversejs/converse.js/blob/v8.0.1/src/entry.js

const plugins = {};

const converse = {
  plugins: {
    add(name, plugin) {
      if (plugins[name] !== undefined) {
        throw new TypeError(
          `Error: plugin with name "${name}" has already been ` + 'registered!',
        );
      }
      plugins[name] = plugin;
    },
  },

  async initialize(settings = {}) {
    (await converse.load(settings)).initialize(settings);
  },

  /**
   * Public API method which explicitly loads Converse and allows you the
   * possibility to pass in configuration settings which need to be defined
   * before loading. Currently this is only the [assets_path](https://conversejs.org/docs/html/configuration.html#assets_path)
   * setting.
   *
   * If not called explicitly, this method will be called implicitly once
   * {@link converse.initialize} is called.
   *
   * In most cases, you probably don't need to explicitly call this method,
   * however, until converse.js has been loaded you won't have access to the
   * utility methods and globals exposed via {@link converse.env}. So if you
   * need to access `converse.env` outside of any plugins and before
   * `converse.initialize` has been called, then you need to call
   * `converse.load` first.
   *
   * @memberOf converse
   * @method load
   * @param {object} settings A map of configuration-settings that are needed at load time.
   * @example
   * converse.load({assets_path: '/path/to/assets/'});
   */
  async load(settings = {}) {
    if (settings.assets_path) {
      __webpack_public_path__ = settings.assets_path; // eslint-disable-line no-undef
    }

    await import(`@converse/headless`);

    Object.keys(plugins).forEach((name) =>
      converse.plugins.add(name, plugins[name]),
    );
    return converse;
  },
};

window.converse = converse;

/**
 * Once Converse.js has loaded, it'll dispatch a custom event with the name `converse-loaded`.
 * You can listen for this event in order to be informed as soon as converse.js has been
 * loaded and parsed, which would mean it's safe to call `converse.initialize`.
 * @event converse-loaded
 * @example window.addEventListener('converse-loaded', () => converse.initialize());
 */
const ev = new CustomEvent('converse-loaded', { detail: { converse } });
window.dispatchEvent(ev);

export default converse;

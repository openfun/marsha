import { appNames, flags } from 'types/AppData';

/**
 * Additional configuration for declared applications
 * If a declared app is not configured here, default behavior will bu used
 * Check field configuration documentation
 *
 * => flag
 * Feature flag is optional here, declared app without configuration is displayed by default
 * When a flag is specified :
 *  - if the associated flag is disable, app will not be loaded and displayed
 *  - if the associated flag is enabled, app will be loaded and displayed
 */
export const appConfigs: { [key in appNames]?: { flag?: flags } } = {
  [appNames.BBB]: { flag: flags.BBB },
  [appNames.MARKDOWN]: { flag: flags.MARKDOWN },
};

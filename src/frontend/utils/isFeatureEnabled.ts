import { appData } from '../data/appData';
import { flags } from '../types/AppData';

export const isFeatureEnabled = (name: flags): boolean => {
  return appData.flags ? appData.flags[name] ?? false : false;
};

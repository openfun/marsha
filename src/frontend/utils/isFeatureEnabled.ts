import { appData } from '../data/appData';
import { Flags } from '../types/AppData';

export const isFeatureEnabled = (name: Flags): boolean => {
  return appData.flags[name] ?? false;
};

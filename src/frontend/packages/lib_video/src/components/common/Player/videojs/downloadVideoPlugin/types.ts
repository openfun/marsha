import { urls } from 'lib-components';
import videojs from 'video.js';

export enum Events {
  DOWNLOAD = 'download',
}

export interface DownloadVideoQualityItemOptions
  extends videojs.MenuItemOptions {
  label: string;
  src: string | undefined;
}

export interface DownloadVideoPluginOptions {
  urls: Partial<urls>;
}

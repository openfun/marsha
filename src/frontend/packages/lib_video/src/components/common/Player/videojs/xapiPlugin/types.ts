import { Maybe } from 'lib-common';
import { Video } from 'lib-components';

export interface XapiPluginOptions {
  video: Video;
  locale: Maybe<string>;
  dispatchPlayerTimeUpdate: (time: number) => void;
}

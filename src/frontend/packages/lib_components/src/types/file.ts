import { Nullable } from 'lib-common';

import { Playlist, Resource, uploadState } from './tracks';

export interface Document extends Resource {
  description: string;
  extension: string;
  filename: string;
  is_ready_to_show: boolean;
  title: Nullable<string>;
  upload_state: uploadState;
  url: string;
  lti_url?: Nullable<string>;
  show_download: boolean;
  playlist: Playlist;
}

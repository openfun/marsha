import { Playlist, Resource, uploadState } from './tracks';
import { Nullable } from '../utils/types';

export interface Document extends Resource {
  description: string;
  extension: string;
  filename: string;
  is_ready_to_show: boolean;
  title: string;
  upload_state: uploadState;
  url: string;
  lti_url?: Nullable<string>;
  show_download: boolean;
  playlist: Playlist;
}

import { Playlist, Resource, UploadState } from './tracks';

export interface Document extends Resource {
  description: string;
  extension: string;
  filename: string;
  is_ready_to_show: boolean;
  title: string;
  upload_state: UploadState;
  url: string;
  show_download: boolean;
  playlist: Playlist;
}

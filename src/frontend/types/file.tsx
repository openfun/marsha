import { Resource, uploadState } from './tracks';

export interface Document extends Resource {
  description: string;
  is_ready_to_display: boolean;
  title: string;
  upload_state: uploadState;
  url: string;
  show_download: boolean;
}

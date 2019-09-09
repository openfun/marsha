import { Resource, uploadState } from './tracks';

export interface Document extends Resource {
  description: string;
  extension: string;
  filename: string;
  is_ready_to_show: boolean;
  title: string;
  upload_state: uploadState;
  url: string;
  show_download: boolean;
}

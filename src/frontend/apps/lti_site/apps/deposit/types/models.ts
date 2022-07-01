import { Playlist, Resource, uploadState } from 'types/tracks';
import { Nullable } from 'utils/types';

export enum modelName {
  FileDepositories = 'filedepositories',
  DepositedFiles = 'depositedfiles',
}

export interface FileDepository extends Resource {
  deposited_files: DepositedFile[];
  description: Nullable<string>;
  lti_url: string;
  playlist: Playlist;
  title: Nullable<string>;
}

export interface DepositedFile extends Resource {
  file_depository: FileDepository;
  filename: string;
  size: string;
  upload_state: string;
  uploaded_by: string;
  uploaded_on: string;
  url: string;
}

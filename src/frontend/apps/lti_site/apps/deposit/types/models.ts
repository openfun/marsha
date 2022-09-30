import { Nullable } from 'lib-common';

import { Playlist, Resource, uploadState } from 'types/tracks';

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
  author_name: string;
  file_depository: FileDepository;
  filename: string;
  size: string;
  read: boolean;
  upload_state: uploadState;
  uploaded_on: string;
  url: string;
}

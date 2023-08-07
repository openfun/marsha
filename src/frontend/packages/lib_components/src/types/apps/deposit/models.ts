import { Nullable } from 'lib-common';

import { Playlist, Resource, uploadState } from '@lib-components/types/tracks';

export enum FileDepositoryModelName {
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
  file_depository_id: FileDepository['id'];
  filename: string;
  size: string;
  read: boolean;
  upload_state: uploadState;
  uploaded_on: string;
  url: string;
}

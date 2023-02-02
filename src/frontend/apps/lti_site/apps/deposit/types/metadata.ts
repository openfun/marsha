import { DepositedFile, ResourceMetadata } from 'lib-components';

export interface DepositedFileMetadata extends ResourceMetadata<DepositedFile> {
  upload_max_size_bytes: number;
}

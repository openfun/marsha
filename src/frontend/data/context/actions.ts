import { UploadableObject } from '../../types/tracks';

export interface UploadProgressNotification<R extends UploadableObject> {
  id: R['id'];
  progress: number;
  type: 'UPLOAD_PROGRESS_NOTIFY';
}

export function notifyUploadProgress<R extends UploadableObject>(
  id: R['id'],
  progress: number,
): UploadProgressNotification<R> {
  return { id, progress, type: 'UPLOAD_PROGRESS_NOTIFY' };
}

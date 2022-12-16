import { Nullable } from 'lib-common';
import {
  UploadManagerState,
  UploadManagerStatus,
  Thumbnail,
  uploadState,
} from 'lib-components';
import { defineMessages, MessageDescriptor } from 'react-intl';

const messages = defineMessages({
  thumbnailError: {
    defaultMessage:
      'An error happened while uploading your thumbnail. Please retry.',
    description: 'A text displayed when there is no uploaded thumbnail.',
    id: 'components.ThumbnailManager.thumbnailError',
  },
  thumbnailUploaded: {
    defaultMessage: 'Your image is being uploaded.',
    description: 'A text displayed when the thumbnail is being uploaded.',
    id: 'components.ThumbnailManager.thumbnailUploaded',
  },
  thumbnailProcessed: {
    defaultMessage: 'Your image is being processed.',
    description: 'A text displayed when the thumbnail is being processed.',
    id: 'components.ThumbnailManager.thumbnailProcessed',
  },
});

export const determineMessage = (
  thumbnail: Thumbnail,
  uploadManagerState: UploadManagerState,
): Nullable<MessageDescriptor> => {
  if (thumbnail.upload_state === uploadState.ERROR) {
    return messages.thumbnailError;
  }
  if (
    (thumbnail.upload_state === uploadState.PENDING &&
      uploadManagerState[thumbnail.id]?.status ===
        UploadManagerStatus.UPLOADING) ||
    uploadManagerState[thumbnail.id]?.status === UploadManagerStatus.INIT
  ) {
    return messages.thumbnailUploaded;
  }
  if (
    thumbnail.upload_state === uploadState.PROCESSING ||
    (thumbnail.upload_state === uploadState.PENDING &&
      uploadManagerState[thumbnail.id]?.status === UploadManagerStatus.SUCCESS)
  ) {
    return messages.thumbnailProcessed;
  }
  return null;
};

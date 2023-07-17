import { Nullable } from 'lib-common';
import {
  Thumbnail,
  UploadManagerState,
  UploadManagerStatus,
  uploadState,
} from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  thumbnailError: {
    defaultMessage:
      'An error happened while uploading your thumbnail. Please retry.',
    description: 'A text displayed when there is no uploaded thumbnail.',
    id: 'components.ThumbnailManager.thumbnailError',
  },
  thumbnailUploaded: {
    defaultMessage: 'Your image is being uploaded ({progress}/100).',
    description: 'A text displayed when the thumbnail is being uploaded.',
    id: 'components.ThumbnailManager.thumbnailUploaded',
  },
  thumbnailProcessed: {
    defaultMessage: 'Your image is being processed.',
    description: 'A text displayed when the thumbnail is being processed.',
    id: 'components.ThumbnailManager.thumbnailProcessed',
  },
});

export const useDetermineMessage = (
  thumbnail: Thumbnail,
  uploadManagerState: UploadManagerState,
): Nullable<string> => {
  const intl = useIntl();

  if (thumbnail.upload_state === uploadState.ERROR) {
    return intl.formatMessage(messages.thumbnailError);
  }
  if (
    [UploadManagerStatus.UPLOADING, UploadManagerStatus.INIT].includes(
      uploadManagerState[thumbnail.id]?.status,
    )
  ) {
    return intl.formatMessage(messages.thumbnailUploaded, {
      progress: uploadManagerState[thumbnail.id]?.progress || 0,
    });
  }
  if (
    thumbnail.upload_state === uploadState.PROCESSING ||
    (thumbnail.upload_state === uploadState.PENDING &&
      uploadManagerState[thumbnail.id]?.status === UploadManagerStatus.SUCCESS)
  ) {
    return intl.formatMessage(messages.thumbnailProcessed);
  }
  return null;
};

import { defineMessages } from 'react-intl';

import { UploadManagerStatus } from 'components/UploadManager';
import { useJwt } from 'data/stores/useJwt';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import { thumbnailMockFactory } from 'utils/tests/factories';

import { determineMessage } from './utils';

const genericThumbnail = thumbnailMockFactory();
const genericUploadManagerState = {
  [genericThumbnail.id]: {
    file: new File(['(⌐□_□)'], 'genericFile.png'),
    objectId: genericThumbnail.id,
    objectType: modelName.THUMBNAILS,
    progress: 50,
    status: UploadManagerStatus.UPLOADING,
  },
};

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

describe('DashboardLiveWidgetThumbnail/utils', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  it('determineMessage when thumbnail upload has an error', () => {
    const thumbnailInError = {
      ...genericThumbnail,
      upload_state: uploadState.ERROR,
    };

    expect(
      determineMessage(thumbnailInError, genericUploadManagerState),
    ).toEqual(messages.thumbnailError);
  });

  it('determineMessage when thumbnail is being uploaded', () => {
    const uploadingThumbnail = {
      ...genericThumbnail,
      upload_state: uploadState.PENDING,
    };
    const initializatingUploadManagerState = {
      [genericThumbnail.id]: {
        ...genericUploadManagerState[genericThumbnail.id],
        status: UploadManagerStatus.INIT,
      },
    };

    expect(
      determineMessage(uploadingThumbnail, genericUploadManagerState),
    ).toEqual(messages.thumbnailUploaded);

    expect(
      determineMessage(uploadingThumbnail, initializatingUploadManagerState),
    ).toEqual(messages.thumbnailUploaded);
  });

  it('determineMessage when thumbnail is being processed', () => {
    const uploadingThumbnail = {
      ...genericThumbnail,
      upload_state: uploadState.PENDING,
    };
    const processedThumbnail = {
      ...genericThumbnail,
      upload_state: uploadState.PROCESSING,
    };
    const successfulUploadManagerState = {
      [genericThumbnail.id]: {
        ...genericUploadManagerState[genericThumbnail.id],
        status: UploadManagerStatus.SUCCESS,
      },
    };

    expect(
      determineMessage(processedThumbnail, genericUploadManagerState),
    ).toEqual(messages.thumbnailProcessed);

    expect(
      determineMessage(uploadingThumbnail, successfulUploadManagerState),
    ).toEqual(messages.thumbnailProcessed);
  });

  it('determineMessage when there is no message to return', () => {
    expect(
      determineMessage(genericThumbnail, genericUploadManagerState),
    ).toEqual(null);
  });
});

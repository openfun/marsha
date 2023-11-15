import { Nullable, colorsTokens } from 'lib-common';
import {
  Box,
  ObjectStatusPicker,
  RetryUploadButton,
  SharedLiveMedia,
  Text,
  UploadingObject,
  uploadState,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DeleteSharedLiveMediaButton } from './DeleteSharedLiveMediaButton';
import { TitleDisplayer } from './TitleDisplayer';
import { ToggleDownload } from './ToggleDownload';
import { ToggleSharing } from './ToggleSharing';

const messages = defineMessages({
  retryUploadFailedLabel: {
    defaultMessage: 'Retry',
    description:
      'Label of the button allowing to retry upload when it has failed.',
    id: 'component.SharedLiveMediaItem.retryUploadFailedLabel',
  },
});

interface SharedLiveMediaItemProps {
  isShared: Nullable<boolean>;
  onRetryFailedUpload: (sharedLiveMediaId: SharedLiveMedia['id']) => void;
  sharedLiveMedia: SharedLiveMedia;
  uploadingObject?: UploadingObject;
  isLive: boolean;
  isTeacher: boolean;
}

export const SharedLiveMediaItem = ({
  isShared,
  onRetryFailedUpload,
  sharedLiveMedia,
  uploadingObject,
  isLive,
  isTeacher,
}: SharedLiveMediaItemProps) => {
  const intl = useIntl();

  const IS_UPLOAD_IN_PROGRESS =
    (sharedLiveMedia.upload_state === uploadState.PENDING && uploadingObject) ||
    sharedLiveMedia.upload_state === uploadState.PROCESSING;

  return (
    <Box fill="horizontal" gap="xxsmall">
      <Box direction="row" align="center" fill="horizontal" gap="xxsmall">
        {isTeacher && !IS_UPLOAD_IN_PROGRESS && (
          <Box direction="row" align="center" gap="small">
            <DeleteSharedLiveMediaButton sharedLiveMedia={sharedLiveMedia} />
          </Box>
        )}

        <Box style={{ minWidth: '0' }}>
          <TitleDisplayer
            sharedLiveMedia={sharedLiveMedia}
            uploadingTitle={uploadingObject?.file.name}
          />
        </Box>
      </Box>

      {isTeacher &&
        !IS_UPLOAD_IN_PROGRESS &&
        sharedLiveMedia.upload_state === uploadState.READY && (
          <Box
            pad={{ vertical: 'xsmall', horizontal: 'small' }}
            background={colorsTokens['info-100']}
            round="xsmall"
            direction="row"
            gap="small"
            flow="wrap"
            justify="space-between"
            style={{ border: `1px solid #c0d4ed` }}
          >
            {isLive && (
              <Box>
                <ToggleSharing
                  isShared={isShared}
                  sharedLiveMediaId={sharedLiveMedia.id}
                  videoId={sharedLiveMedia.video}
                />
              </Box>
            )}
            <Box>
              <ToggleDownload
                isDownloadAllowed={sharedLiveMedia.show_download}
                sharedLiveMediaId={sharedLiveMedia.id}
                videoId={sharedLiveMedia.video}
              />
            </Box>
          </Box>
        )}

      {isTeacher && IS_UPLOAD_IN_PROGRESS && (
        <Box
          pad={{ vertical: 'xsmall', horizontal: 'small' }}
          background={colorsTokens['info-100']}
          round="xsmall"
          align="center"
          style={{ border: `1px solid #c0d4ed` }}
        >
          <Text truncate>
            <ObjectStatusPicker
              object={sharedLiveMedia}
              uploadStatus={uploadingObject?.status}
            />
          </Text>
        </Box>
      )}

      {isTeacher &&
        !IS_UPLOAD_IN_PROGRESS &&
        sharedLiveMedia.upload_state !== uploadState.READY && (
          <Box
            pad={{ vertical: 'xsmall', horizontal: 'small' }}
            background={colorsTokens['info-100']}
            round="xsmall"
            align="center"
            justify="center"
            direction="row"
            style={{ border: `1px solid #c0d4ed` }}
          >
            <Text color={colorsTokens['danger-300']}>
              {intl.formatMessage(messages.retryUploadFailedLabel)}
            </Text>

            <RetryUploadButton
              color={colorsTokens['danger-500']}
              onClick={() => onRetryFailedUpload(sharedLiveMedia.id)}
            />
          </Box>
        )}
    </Box>
  );
};

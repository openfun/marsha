import { Box, Text } from 'grommet';
import { Nullable } from 'lib-common';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ObjectStatusPicker } from 'components/ObjectStatusPicker';
import { RetryUploadButton } from 'components/RetryUploadButton';
import { UploadingObject, SharedLiveMedia, uploadState } from 'lib-components';

import { AllowedDownloadButton } from './AllowedDownloadButton';
import { DisallowedDownloadButton } from './DisallowedDownloadButton';
import { DeleteSharedLiveMediaButton } from './DeleteSharedLiveMediaButton';
import { StartSharingButton } from './StartSharingButton';
import { StopSharingButton } from './StopSharingButton';
import { TitleDisplayer } from './TitleDisplayer';

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
    <Box
      direction="row"
      align="center"
      fill="horizontal"
      height="60px"
      gap="medium"
      pad={{ horizontal: 'small', vertical: 'small' }}
    >
      {isTeacher &&
        (sharedLiveMedia.show_download ? (
          <AllowedDownloadButton sharedLiveMediaId={sharedLiveMedia.id} />
        ) : (
          <DisallowedDownloadButton sharedLiveMediaId={sharedLiveMedia.id} />
        ))}

      {isTeacher && (
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

      {isTeacher && (
        <Box
          align="center"
          direction="row"
          justify="center"
          margin={{ left: 'auto' }}
        >
          {sharedLiveMedia.upload_state === uploadState.READY ? (
            isLive && (
              <Box justify="center" margin={{ left: 'auto' }}>
                {!isShared ? (
                  <StartSharingButton sharedLiveMediaId={sharedLiveMedia.id} />
                ) : (
                  <StopSharingButton />
                )}
              </Box>
            )
          ) : IS_UPLOAD_IN_PROGRESS ? (
            <Text
              color="blue-active"
              size="0.9rem"
              style={{ fontFamily: 'Roboto-Medium' }}
              truncate
            >
              <ObjectStatusPicker object={sharedLiveMedia} />
            </Text>
          ) : (
            <React.Fragment>
              <Box>
                <Text
                  color="red-active"
                  size="0.9rem"
                  style={{ fontFamily: 'Roboto-Medium' }}
                >
                  {intl.formatMessage(messages.retryUploadFailedLabel)}
                </Text>
              </Box>

              <RetryUploadButton
                color="red-active"
                onClick={() => onRetryFailedUpload(sharedLiveMedia.id)}
              />
            </React.Fragment>
          )}
        </Box>
      )}
    </Box>
  );
};

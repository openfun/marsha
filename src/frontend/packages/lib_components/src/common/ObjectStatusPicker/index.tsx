import React, { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Box, Text } from '@lib-components/common';
import { UploadManagerStatus } from '@lib-components/common/UploadManager';
import {
  UploadableObject,
  Video,
  liveState,
  uploadState,
} from '@lib-components/types/tracks';

import { BoxLoader } from '../Loader/BoxLoader';

const { DELETED, ERROR, PENDING, PROCESSING } = uploadState;
const { HARVESTING } = liveState;

const messages = defineMessages({
  deleted: {
    defaultMessage: 'Deleted',
    description: 'Status information for a video/audio/timed text track',
    id: 'common.ObjectStatusPicker.DELETED',
  },
  error: {
    defaultMessage: 'Error',
    description: 'Status information for a video/audio/timed text track',
    id: 'common.ObjectStatusPicker.ERROR',
  },
  harvested: {
    defaultMessage: 'Waiting VOD publication',
    description: 'Status information for a video/audio/timed text track',
    id: 'common.ObjectStatusPicker.HARVESTED',
  },
  harvesting: {
    defaultMessage: 'Transforming live in VOD',
    description: 'Status information for a video/audio/timed text track',
    id: 'common.ObjectStatusPicker.HARVESTING',
  },
  initialized: {
    defaultMessage: 'Initialized',
    description: 'Status information for a video/audio/timed text track',
    id: 'common.ObjectStatusPicker.INITIALIZED',
  },
  pending: {
    defaultMessage: 'Missing',
    description: 'Status information for a video/audio/timed text track',
    id: 'common.ObjectStatusPicker.PENDING',
  },
  processing: {
    defaultMessage: 'Processing',
    description: 'Status information for a video/audio/timed text track',
    id: 'common.ObjectStatusPicker.PROCESSING',
  },
  ready: {
    defaultMessage: 'Ready',
    description: 'Status information for a video/audio/timed text track',
    id: 'common.ObjectStatusPicker.READY',
  },
  idle: {
    defaultMessage: 'Ready to start live',
    description: 'The video is in live state and ready to be start',
    id: 'common.ObjectStatusPicker.IDLE',
  },
  starting: {
    defaultMessage: 'live Starting',
    description: 'The video is in live state and live is starting',
    id: 'common.ObjectStatusPicker.STARTING',
  },
  running: {
    defaultMessage: 'Live is running',
    description: 'The video is in live state and live is running',
    id: 'common.ObjectStatusPicker.RUNNING',
  },
  stopped: {
    defaultMessage: 'Live ended',
    description: 'The video is in live state and has ended',
    id: 'common.ObjectStatusPicker.STOPPED',
  },
  stopping: {
    defaultMessage: 'Live is stopping',
    description: 'The video is in live state and is stopping',
    id: 'common.ObjectStatusPicker.STOPPING',
  },
  ended: {
    defaultMessage: 'Live has ended',
    description: 'The video is in live state and is ended',
    id: 'common.ObjectStatusPicker.ENDED',
  },
  uploadingObject: {
    defaultMessage: 'Uploading',
    description: 'Status information for a video/audio/timed text track',
    id: 'common.ObjectStatusPicker.UPLOADING',
  },
});

const isPossibleLiveObject = (object: UploadableObject): object is Video =>
  (object as Video)?.live_state !== undefined;

/** Props shape for the ObjectStatusPicker component. */
export interface ObjectStatusPickerProps {
  object: UploadableObject;
  uploadStatus?: UploadManagerStatus;
}

/**
 * Displays the current status for an uploadable object, based on its status and
 * the state of the upload manager.
 * @param object The current state of the video/track upload.
 */
export const ObjectStatusPicker = ({
  object,
  uploadStatus,
}: ObjectStatusPickerProps) => {
  const intl = useIntl();

  if (isPossibleLiveObject(object) && object.live_state) {
    return (
      <Fragment>{intl.formatMessage(messages[object.live_state])}</Fragment>
    );
  }

  let message = messages[object.upload_state];
  if (object.upload_state === PENDING) {
    if (uploadStatus === UploadManagerStatus.UPLOADING) {
      // If we know we're currently uploading a file for the object, we can override the
      // object's own upload_state.
      message = messages.uploadingObject;
    } else if (uploadStatus === UploadManagerStatus.SUCCESS) {
      // We have not yet received the updated object but we know the object *should* be
      // processing. If there is an error we'll receive the information after the object
      // is updated with a new upload_state.
      message = messages[PROCESSING];
    }
  }

  let icon: JSX.Element | string;
  if (
    [HARVESTING, PROCESSING].includes(object.upload_state) ||
    (object.upload_state === PENDING &&
      uploadStatus &&
      [UploadManagerStatus.UPLOADING, UploadManagerStatus.SUCCESS].includes(
        uploadStatus,
      ))
  ) {
    icon = <BoxLoader size="small" boxProps={{ margin: 'small' }} />;
  } else if ([DELETED, ERROR, PENDING].includes(object.upload_state)) {
    icon = '❌';
  } else {
    icon = '✔️';
  }

  return (
    <Box direction="row" margin="none" pad="none" align="center">
      <Text>
        {intl.formatMessage(message)}&nbsp;{icon}
      </Text>
    </Box>
  );
};

import { Box } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import {
  liveState as liveStateTrack,
  UploadableObject,
  uploadState,
  Video,
} from '../../types/tracks';
import { Spinner } from '../Loader';
import { UploadManagerStatus, useUploadManager } from '../UploadManager';

const { DELETED, ERROR, HARVESTED, HARVESTING, PENDING, PROCESSING, READY } =
  uploadState;
const { CREATING, IDLE, STARTING, RUNNING, STOPPED, STOPPING } = liveStateTrack;

const messages = defineMessages({
  [CREATING]: {
    defaultMessage: 'Creating',
    description: 'Live video in creation status',
    id: 'components.ObjectStatusPicker.CREATING',
  },
  [DELETED]: {
    defaultMessage: 'Deleted',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.ObjectStatusPicker.DELETED',
  },
  [ERROR]: {
    defaultMessage: 'Error',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.ObjectStatusPicker.ERROR',
  },
  [HARVESTED]: {
    defaultMessage: 'Waiting VOD publication',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.ObjectStatusPicker.HARVESTED',
  },
  [HARVESTING]: {
    defaultMessage: 'Transforming live in VOD',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.ObjectStatusPicker.HARVESTING',
  },
  [PENDING]: {
    defaultMessage: 'Missing',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.ObjectStatusPicker.PENDING',
  },
  [PROCESSING]: {
    defaultMessage: 'Processing',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.ObjectStatusPicker.PROCESSING',
  },
  [READY]: {
    defaultMessage: 'Ready',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.ObjectStatusPicker.READY',
  },
  [IDLE]: {
    defaultMessage: 'Ready to start live',
    description: 'The video is in live state and ready to be start',
    id: 'components.ObjectStatusPicker.IDLE',
  },
  [STARTING]: {
    defaultMessage: 'live Starting',
    description: 'The video is in live state and live is starting',
    id: 'components.ObjectStatusPicker.STARTING',
  },
  [RUNNING]: {
    defaultMessage: 'Live is running',
    description: 'The video is in live state and live is running',
    id: 'components.ObjectStatusPicker.RUNNING',
  },
  [STOPPED]: {
    defaultMessage: 'Live ended',
    description: 'The video is in live state and has ended',
    id: 'components.ObjectStatusPicker.STOPPED',
  },
  [STOPPING]: {
    defaultMessage: 'Live is stopping',
    description: 'The video is in live state and is stopping',
    id: 'components.ObjectStatusPicker.STOPPING',
  },
  uploadingObject: {
    defaultMessage: 'Uploading',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.ObjectStatusPicker.UPLOADING',
  },
});

const isPossibleLiveObject = (object: UploadableObject): object is Video =>
  (object as any)?.live_state !== undefined;

/** Props shape for the ObjectStatusPicker component. */
export interface ObjectStatusPickerProps {
  object: UploadableObject;
}

/**
 * Displays the current status for an uploadable object, based on its status and
 * the state of the upload manager.
 * @param object The current state of the video/track upload.
 */
export const ObjectStatusPicker = ({ object }: ObjectStatusPickerProps) => {
  const { uploadManagerState } = useUploadManager();

  if (isPossibleLiveObject(object) && object.live_state) {
    return <FormattedMessage {...messages[object.live_state]} />;
  }

  let message = messages[object.upload_state];
  if (object.upload_state === PENDING) {
    if (
      uploadManagerState[object.id]?.status === UploadManagerStatus.UPLOADING
    ) {
      // If we know we're currently uploading a file for the object, we can override the
      // object's own upload_state.
      message = messages.uploadingObject;
    } else if (
      uploadManagerState[object.id]?.status === UploadManagerStatus.SUCCESS
    ) {
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
      [UploadManagerStatus.UPLOADING, UploadManagerStatus.SUCCESS].includes(
        uploadManagerState[object.id]?.status,
      ))
  ) {
    icon = <Spinner aria-hidden={true} size="small" />;
  } else if ([DELETED, ERROR, PENDING].includes(object.upload_state)) {
    icon = '❌';
  } else {
    icon = '✔️';
  }

  return (
    <Box direction="row" margin="none" pad="none">
      <FormattedMessage {...message} />
      &nbsp;
      {icon}
    </Box>
  );
};

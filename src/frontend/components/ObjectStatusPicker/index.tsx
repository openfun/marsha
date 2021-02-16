import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { LiveState as liveStateTrack, UploadState } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { StatusIconKey, UploadStatus } from './UploadStatus';

const {
  DELETED,
  ERROR,
  HARVESTED,
  HARVESTING,
  PENDING,
  PROCESSING,
  READY,
  UPLOADING,
} = UploadState;
const { IDLE, STARTING, RUNNING, STOPPED } = liveStateTrack;

const messages = defineMessages({
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
  [UPLOADING]: {
    defaultMessage: 'Uploading',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.ObjectStatusPicker.UPLOADING',
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
});

/** Props shape for the ObjectStatusPicker component. */
export interface ObjectStatusPickerProps {
  className?: string;
  state: UploadState;
  liveState?: Nullable<liveStateTrack>;
}

/** Component. Displays the list of statuses for an upload, showing (and/or highlighting)
 * the relevant one, along with relevant status icon(s).
 * @param state The current state of the video/track upload.
 */
export const ObjectStatusPicker = ({
  className = '',
  state,
  liveState,
}: ObjectStatusPickerProps) => {
  if (liveState) {
    return <FormattedMessage {...messages[liveState]} />;
  }
  let statusIcon;
  if ([PROCESSING, UPLOADING].includes(state)) {
    statusIcon = StatusIconKey.LOADER;
  } else if ([DELETED, ERROR, PENDING].includes(state)) {
    statusIcon = StatusIconKey.X;
  } else {
    statusIcon = StatusIconKey.TICK;
  }
  return (
    <UploadStatus className={className || ''} statusIcon={statusIcon}>
      <FormattedMessage {...messages[state]} />
    </UploadStatus>
  );
};

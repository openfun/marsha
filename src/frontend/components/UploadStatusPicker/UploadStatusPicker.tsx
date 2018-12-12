import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { uploadState } from '../../types/tracks';
import { statusIconKey, UploadStatus } from './UploadStatus';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

const messages = defineMessages({
  [ERROR]: {
    defaultMessage: 'Error',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusPicker.ERROR',
  },
  [PENDING]: {
    defaultMessage: 'Missing',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusPicker.PENDING',
  },
  [PROCESSING]: {
    defaultMessage: 'Processing',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusPicker.PROCESSING',
  },
  [READY]: {
    defaultMessage: 'Ready',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusPicker.READY',
  },
  [UPLOADING]: {
    defaultMessage: 'Uploading',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusPicker.UPLOADING',
  },
});

/** Props shape for the UploadStatusPicker component. */
export interface UploadStatusPickerProps {
  state: uploadState;
}

/** Component. Displays the list of statuses for an upload, showing (and/or highlighting)
 * the relevant one, along with relevant status icon(s).
 * @param state The current state of the video/track upload.
 */
export const UploadStatusPicker = ({ state }: UploadStatusPickerProps) => (
  <UploadStatus
    statusIcon={
      [PROCESSING, UPLOADING].includes(state)
        ? statusIconKey.LOADER
        : [ERROR, PENDING].includes(state)
          ? statusIconKey.X
          : statusIconKey.TICK
    }
  >
    <FormattedMessage {...messages[state]} />
  </UploadStatus>
);

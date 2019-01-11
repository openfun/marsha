import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { uploadState } from '../../types/tracks';
import { colors } from '../../utils/theme/theme';
import { statusIconKey, UploadStatus } from './UploadStatus';

const { PROCESSING, READY, UPLOADING } = uploadState;

const messages = defineMessages({
  statusProcessed: {
    defaultMessage: 'Processed',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusList.statusProcessed',
  },
  statusProcessing: {
    defaultMessage: 'Processing',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusList.statusProcessing',
  },
  statusReady: {
    defaultMessage: 'Ready',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusList.statusReady',
  },
  statusUploaded: {
    defaultMessage: 'Uploaded',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusList.statusUploaded',
  },
  statusUploading: {
    defaultMessage: 'Uploading',
    description: 'Status information for a video/audio/timed text track',
    id: 'components.UploadStatusList.statusUploading',
  },
});

const UploadStatusListStyled = styled.ul`
  display: flex;
  justify-items: justified;
  margin: 0;
  padding: 1rem 0;
  list-style-type: none;
  background: ${colors.mediumGray.main};
`;

/** Props shape for the UploadStatusList component. */
export interface UploadStatusListProps {
  state: uploadState;
}

/** Component. Displays the list of statuses for an upload, showing (and/or highlighting)
 * the relevant one, along with relevant status icon(s).
 * @param state The current state of the video/track upload.
 */
export class UploadStatusList extends React.Component<UploadStatusListProps> {
  render() {
    const { state } = this.props;

    return (
      <UploadStatusListStyled>
        <UploadStatus
          isHighlighted={state === UPLOADING}
          statusIcon={
            state === UPLOADING
              ? statusIconKey.LOADER
              : [PROCESSING, READY].includes(state)
                ? statusIconKey.TICK
                : undefined
          }
        >
          <FormattedMessage
            {...([PROCESSING, READY].includes(state)
              ? messages.statusUploaded
              : messages.statusUploading)}
          />
        </UploadStatus>
        <UploadStatus
          isHighlighted={state === PROCESSING}
          statusIcon={
            state === PROCESSING
              ? statusIconKey.LOADER
              : state === READY
                ? statusIconKey.TICK
                : undefined
          }
        >
          <FormattedMessage
            {...(state === READY
              ? messages.statusProcessed
              : messages.statusProcessing)}
          />
        </UploadStatus>
        <UploadStatus
          isHighlighted={state === READY}
          statusIcon={state === READY ? statusIconKey.TICK : undefined}
        >
          <FormattedMessage {...messages.statusReady} />
        </UploadStatus>
      </UploadStatusListStyled>
    );
  }
}

import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { videoState } from '../../types/Video';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = videoState;

const messages: {
  [state in videoState]: FormattedMessage.MessageDescriptor
} = defineMessages({
  [ERROR]: {
    defaultMessage:
      'There was an error with your video. Retry or upload another one.',
    description:
      'Dashboard helptext for when the video failed to upload or get processed.',
    id: 'components.Dashboard.DashboardHelptext.helptextError',
  },
  [PENDING]: {
    defaultMessage: 'There is currently no video to display here.',
    description:
      'Dashboard helptext for the case when there is no existing video nor anything in progress.',
    id: 'components.Dashboard.DashboardHelptext.helptextPending',
  },
  [PROCESSING]: {
    defaultMessage:
      'Your video is currently processing. This may take up to an hour. Please come back later.',
    description:
      'Dashboard helptext to warn users not to wait for video processing in front of this page.',
    id: 'components.Dashboard.DashboardHelptext.helptextProcessing',
  },
  [READY]: {
    defaultMessage: 'Your video is ready to play.',
    description: 'Dashboard helptext for ready-to-play videos.',
    id: 'components.Dashboard.DashboardHelptext.helptextReady',
  },
  [UPLOADING]: {
    defaultMessage:
      'Upload in progress... Please do not close or reload this page.',
    description:
      'Dashboard helptext to warn user not to navigate away during video upload.',
    id: 'components.Dashboard.DashboardHelptext.helptextUploading',
  },
});

const DashboardHelptextStyled = styled.div`
  padding: 0 1rem;
`;

/** Props shape for the DashboardHelptext component. */
export interface DashboardHelptextProps {
  state: videoState;
}

/** Component. Displays the relevant helptext for the user depending on the video state.
 * @param state The current state of the video/track upload.
 */
export const DashboardHelptext = (props: DashboardHelptextProps) => (
  <DashboardHelptextStyled>
    <FormattedMessage {...messages[props.state]} />
  </DashboardHelptextStyled>
);

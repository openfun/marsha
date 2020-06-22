import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

const videoMessages = defineMessages({
  [ERROR]: {
    defaultMessage:
      'There was an error with your video. Retry or upload another one.',
    description:
      'Dashboard helptext for when the video failed to upload or get processed.',
    id: 'components.Dashboard.DashboardPaneHelptext.videos.helptextError',
  },
  [PENDING]: {
    defaultMessage: 'There is currently no video to display.',
    description:
      'Dashboard helptext for the case when there is no existing video nor anything in progress.',
    id: 'components.Dashboard.DashboardPaneHelptext.videos.helptextPending',
  },
  [PROCESSING]: {
    defaultMessage:
      'Your video is currently processing. This may take up to an hour. Please come back later.',
    description:
      'Dashboard helptext to warn users not to wait for video processing in front of this page.',
    id: 'components.Dashboard.DashboardPaneHelptext.videos.helptextProcessing',
  },
  [READY]: {
    defaultMessage: 'Your video is ready to play.',
    description: 'Dashboard helptext for ready-to-play videos.',
    id: 'components.Dashboard.DashboardPaneHelptext.videos.helptextReady',
  },
  [UPLOADING]: {
    defaultMessage:
      'Upload in progress... Please do not close or reload this page.',
    description:
      'Dashboard helptext to warn user not to navigate away during video upload.',
    id: 'components.Dashboard.DashboardPaneHelptext.videos.helptextUploading',
  },
});

const documentMessages = defineMessages({
  [ERROR]: {
    defaultMessage:
      'There was an error with your document. Retry or upload another one.',
    description:
      'Dashboard helptext for when the document failed to upload or get processed.',
    id: 'components.Dashboard.DashboardPaneHelptext.documents.helptextError',
  },
  [PENDING]: {
    defaultMessage: 'There is currently no document to display.',
    description:
      'Dashboard helptext for the case when there is no existing document nor anything in progress.',
    id: 'components.Dashboard.DashboardPaneHelptext.documents.helptextPending',
  },
  [PROCESSING]: {
    defaultMessage:
      'Your document is currently processing. This may take some minutes.',
    description: 'Dashboard helptext to warn users document is processing.',
    id:
      'components.Dashboard.DashboardPaneHelptext.documents.helptextProcessing',
  },
  [READY]: {
    defaultMessage: 'Your document is ready to display.',
    description: 'Dashboard helptext for ready-to-display documents.',
    id: 'components.Dashboard.DashboardPaneHelptext.documents.helptextReady',
  },
  [UPLOADING]: {
    defaultMessage:
      'Upload in progress... Please do not close or reload this page.',
    description:
      'Dashboard helptext to warn user not to navigate away during document upload.',
    id:
      'components.Dashboard.DashboardPaneHelptext.documents.helptextUploading',
  },
});

// messages are not directly nested in this object because the babel-plugin-react-intl
// fails to parse it to extract them at build time.
const messages = {
  [modelName.VIDEOS]: videoMessages,
  [modelName.DOCUMENTS]: documentMessages,
};

/** Props shape for the DashboardVideoPaneHelptext component. */
export interface DashboardPaneHelptextProps {
  state: uploadState;
  objectType: modelName.VIDEOS | modelName.DOCUMENTS;
}

/** Component. Displays the relevant helptext for the user depending on the video state.
 * @param state The current state of the document/video upload.
 * @param objectType the object type the state belongs to. Can be documents or videos
 */
export const DashboardPaneHelptext = ({
  objectType,
  state,
}: DashboardPaneHelptextProps) => (
  <div>
    <FormattedMessage {...messages[objectType][state]} />
  </div>
);

import { Box, Button } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Document } from '../../types/file';
import { ModelName } from '../../types/models';
import { Flags } from '../../types/AppData';
import { UploadState, Video } from '../../types/tracks';
import { isFeatureEnabled } from '../../utils/isFeatureEnabled';
import { DashboardVideoLiveConfigureButton } from '../DashboardVideoLiveConfigureButton';
import { PLAYER_ROUTE } from '../routes';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { withLink } from '../withLink/withLink';

const messages = {
  [ModelName.VIDEOS]: defineMessages({
    btnPlay: {
      defaultMessage: 'Watch',
      description:
        'Dashboard button to play the existing video, if there is one.',
      id: 'components.Dashboard.DashboardPaneButtons.videos.btnPlay',
    },
    btnReplace: {
      defaultMessage: 'Replace the video',
      description:
        'Dashboard button to upload a video to replace the existing one, when there *is* an existing video.',
      id: 'components.Dashboard.DashboardPaneButtons.videos.btnReplace',
    },
    btnUploadFirst: {
      defaultMessage: 'Upload a video',
      description:
        'Dashboard button to upload a video, when there is no existing video.',
      id: 'components.Dashboard.DashboardPaneButtons.videos.btnUploadFirst',
    },
  }),
  [ModelName.DOCUMENTS]: defineMessages({
    btnPlay: {
      defaultMessage: 'Display',
      description:
        'Dashboard button to display the existing document, if there is one.',
      id: 'components.Dashboard.DashboardPaneButtons.documents.btnPlay',
    },
    btnReplace: {
      defaultMessage: 'Replace the document',
      description:
        'Dashboard button to upload a document to replace the existing one, when there *is* an existing document.',
      id: 'components.Dashboard.DashboardPaneButtons.documents.btnReplace',
    },
    btnUploadFirst: {
      defaultMessage: 'Upload a document',
      description:
        'Dashboard button to upload a document, when there is no existing document.',
      id: 'components.Dashboard.DashboardPaneButtons.documents.btnUploadFirst',
    },
  }),
};

export const DashboardButton = styled(Button)`
  flex-grow: 1;
  flex-basis: 8rem;
  max-width: 50%;

  :first-child {
    margin-right: 1rem;
  }

  :last-child {
    margin-left: 1rem;
  }
`;
export const DashboardButtonWithLink = withLink(DashboardButton);

/** Props shape for the DashboardVideoPaneButtons component. */
export interface DashboardPaneButtonsProps {
  object: Video | Document;
  objectType: ModelName.VIDEOS | ModelName.DOCUMENTS;
}

/** Component. Displays buttons with links to the Player & the Form, adapting their state and
 * look to the resource's current state.
 * @param object The video or document for which the pane is displaying information & buttons.
 * @param objectType model name the object belongs to. Can be DOCUMENTS or VIDEOS
 * @param routePlayer the route to watch the current object
 */
export const DashboardPaneButtons = ({
  object,
  objectType,
}: DashboardPaneButtonsProps) => {
  const displayWatchBtn = object.upload_state === UploadState.READY;

  return (
    <Box
      direction="row"
      justify={displayWatchBtn ? 'center' : 'end'}
      margin="small"
    >
      {objectType === ModelName.VIDEOS &&
        object.upload_state === UploadState.PENDING &&
        isFeatureEnabled(Flags.VIDEO_LIVE) && (
          <DashboardVideoLiveConfigureButton video={object as Video} />
        )}
      <DashboardButtonWithLink
        label={
          <FormattedMessage
            {...(object.upload_state === UploadState.PENDING
              ? messages[objectType].btnUploadFirst
              : messages[objectType].btnReplace)}
          />
        }
        primary={!displayWatchBtn}
        to={UPLOAD_FORM_ROUTE(objectType, object.id)}
      />
      {displayWatchBtn ? (
        <DashboardButtonWithLink
          label={<FormattedMessage {...messages[objectType].btnPlay} />}
          primary={displayWatchBtn}
          to={PLAYER_ROUTE(objectType)}
        />
      ) : null}
    </Box>
  );
};

import { Box, Button } from 'grommet';
import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { VIDEO_PLAYER_ROUTE } from '../VideoPlayer/route';
import { withLink } from '../withLink/withLink';

const messages = defineMessages({
  btnPlayVideo: {
    defaultMessage: 'Watch',
    description:
      'Dashboard button to play the existing video, if there is one.',
    id: 'components.Dashboard.DashboardVideoPaneButtons.btnPlayVideo',
  },
  btnReplaceVideo: {
    defaultMessage: 'Replace the video',
    description:
      'Dashboard button to upload a video to replace the existing one, when there *is* an existing video.',
    id: 'components.Dashboard.DashboardVideoPaneButtons.btnReplaceVideo',
  },
  btnUploadFirstVideo: {
    defaultMessage: 'Upload a video',
    description:
      'Dashboard button to upload a video, when there is no existing video.',
    id: 'components.Dashboard.DashboardVideoPaneButtons.btnUploadFirstVideo',
  },
});

const BtnWithLink = withLink(Button);
const DashboardButtonStyled = styled(BtnWithLink)`
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

/** Props shape for the DashboardVideoPaneButtons component. */
export interface DashboardVideoPaneButtonsProps {
  video: Video;
}

/** Component. Displays buttons with links to the Player & the Form, adapting their state and
 * look to the video's current state.
 * @param video The video for which the VideoPane is displaying information & buttons.
 */
export const DashboardVideoPaneButtons = ({
  video,
}: DashboardVideoPaneButtonsProps) => {
  const displayWatchBtn = video.upload_state === uploadState.READY;

  return (
    <Box
      direction={'row'}
      justify={displayWatchBtn ? 'center' : 'end'}
      margin={'small'}
    >
      <DashboardButtonStyled
        label={
          <FormattedMessage
            {...(video.upload_state === uploadState.PENDING
              ? messages.btnUploadFirstVideo
              : messages.btnReplaceVideo)}
          />
        }
        primary={!displayWatchBtn}
        to={UPLOAD_FORM_ROUTE(modelName.VIDEOS, video.id)}
      />
      {displayWatchBtn ? (
        <DashboardButtonStyled
          label={<FormattedMessage {...messages.btnPlayVideo} />}
          primary={displayWatchBtn}
          to={VIDEO_PLAYER_ROUTE()}
        />
      ) : null}
    </Box>
  );
};

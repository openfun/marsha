import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { Button } from '../Button/Button';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { VIDEO_PLAYER_ROUTE } from '../VideoPlayer/route';
import { withLink } from '../withLink/withLink';

const { PENDING, READY } = uploadState;

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

const DashboardVideoPaneButtonsStyled = styled.div`
  display: flex;
`;

const DashboardButtonStyled = styled(Button)`
  flex-grow: 1;
  flex-basis: 8rem;

  :first-child {
    margin-right: 1rem;
  }

  :last-child {
    margin-left: 1rem;
  }
`;
const DashboardButtonWithLink = withLink(DashboardButtonStyled);

/** Props shape for the DashboardVideoPaneButtons component. */
export interface DashboardVideoPaneButtonsProps {
  video: Video;
}

/** Component. Displays buttons with links to the Player & the Form, adapting their state and
 * look to the video's current state.
 * @param video The video for which the VideoPane is displaying information & buttons.
 */
export const DashboardVideoPaneButtons = (
  props: DashboardVideoPaneButtonsProps,
) => (
  <DashboardVideoPaneButtonsStyled>
    <DashboardButtonWithLink
      variant="primary"
      to={UPLOAD_FORM_ROUTE(modelName.VIDEOS, props.video.id)}
    >
      <FormattedMessage
        {...(props.video.upload_state === PENDING
          ? messages.btnUploadFirstVideo
          : messages.btnReplaceVideo)}
      />
    </DashboardButtonWithLink>
    <DashboardButtonWithLink
      variant="primary"
      disabled={props.video.upload_state !== READY}
      to={VIDEO_PLAYER_ROUTE()}
    >
      <FormattedMessage {...messages.btnPlayVideo} />
    </DashboardButtonWithLink>
  </DashboardVideoPaneButtonsStyled>
);

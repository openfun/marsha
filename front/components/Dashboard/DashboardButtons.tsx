import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { videoState } from '../../types/Video';
import { Button } from '../Button/Button';
import { ROUTE as FORM_ROUTE } from '../VideoForm/VideoForm';
import { ROUTE as PLAYER_ROUTE } from '../VideoPlayer/VideoPlayer';
import { withLink } from '../withLink/withLink';

const { PENDING, READY } = videoState;

const messages = defineMessages({
  btnPlayVideo: {
    defaultMessage: 'Watch',
    description:
      'Dashboard button to play the existing video, if there is one.',
    id: 'components.Dashboard.DashboardButtons.btnPlayVideo',
  },
  btnReplaceVideo: {
    defaultMessage: 'Replace the video',
    description:
      'Dashboard button to upload a video to replace the existing one, when there *is* an existing video.',
    id: 'components.Dashboard.DashboardButtons.btnReplaceVideo',
  },
  btnUploadFirstVideo: {
    defaultMessage: 'Upload a video',
    description:
      'Dashboard button to upload a video, when there is no existing video.',
    id: 'components.Dashboard.DashboardButtons.btnUploadFirstVideo',
  },
});

const DashboardButtonsStyled = styled.div`
  display: flex;
`;

const DashboardButtonStyled = withLink(styled(Button)`
  flex-grow: 1;
  flex-basis: 8rem;
  margin: 0 1rem;
`);

/** Props shape for the DashboardButtons component. */
export interface DashboardButtonsProps {
  state: videoState;
}

/** Component. Displays buttons with links to the Player & the Form, adapting their state and
 * look to the video's current state.
 * @param state The current state of the video/track upload.
 */
export const DashboardButtons = (props: DashboardButtonsProps) => (
  <DashboardButtonsStyled>
    <DashboardButtonStyled variant="primary" to={FORM_ROUTE()}>
      <FormattedMessage
        {...(props.state === PENDING
          ? messages.btnUploadFirstVideo
          : messages.btnReplaceVideo)}
      />
    </DashboardButtonStyled>
    <DashboardButtonStyled
      variant="primary"
      disabled={props.state !== READY}
      to={PLAYER_ROUTE()}
    >
      <FormattedMessage {...messages.btnPlayVideo} />
    </DashboardButtonStyled>
  </DashboardButtonsStyled>
);

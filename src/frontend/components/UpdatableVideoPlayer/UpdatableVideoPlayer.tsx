import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Video } from 'types/Video';
import { Button } from '../Button/Button';
import { LayoutMainArea } from '../LayoutMainArea/LayoutMainArea';
import { ROUTE as FORM_ROUTE } from '../VideoForm/VideoForm';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { withLink } from '../withLink/withLink';

interface UpdatableVideoPlayerProps {
  video: Video;
}

export const ROUTE = () => '/player-updatable';

const messages = defineMessages({
  button: {
    defaultMessage: 'Update',
    description: 'Send instructor on video form page to upload a new video',
    id: 'components.updateVideo.button',
  },
});

const UpdateVideoContainer = styled(LayoutMainArea)`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const UpdateButtonsStyled = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
`;

const UpdateButtonStyled = withLink(styled(Button)`
  flex-grow: 1;
  margin: 0.3rem;
`);

export class UpdatableVideoPlayer extends React.Component<
  UpdatableVideoPlayerProps
> {
  render() {
    return (
      <UpdateVideoContainer>
        <VideoPlayer video={this.props.video} />
        <UpdateButtonsStyled>
          <UpdateButtonStyled variant="primary" to={FORM_ROUTE()}>
            <FormattedMessage {...messages.button} />
          </UpdateButtonStyled>
        </UpdateButtonsStyled>
      </UpdateVideoContainer>
    );
  }
}

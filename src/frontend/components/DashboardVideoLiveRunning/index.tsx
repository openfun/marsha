import { Box } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { DashboardVideoLiveStopButton } from '../DashboardVideoLiveStopButton';
import { DashboardButtonWithLink } from '../DashboardPaneButtons/DashboardButtons';
import { Chat } from '../Chat';
import { CHAT_ROUTE } from '../Chat/route';
import { PLAYER_ROUTE } from '../routes';
import { modelName } from '../../types/models';
import { LiveModeType, Video } from '../../types/tracks';
import { DashboardJoinDiscussion } from '../DashboardJoinDiscussion';

const messages = defineMessages({
  showLive: {
    defaultMessage: 'show live',
    description: 'button to redirect use to video player.',
    id: 'components.DashboardVideoLiveRunning.showLive',
  },
  chatOnly: {
    defaultMessage: 'show chat only',
    description: 'button to redirect to the chat only view.',
    id: 'components.DashboardVideoLiveRunning.chatOnly',
  },
  showChat: {
    defaultMessage: 'show chat',
    description: 'button to show the chat during a jitsi live.',
    id: 'components.DashboardVideoLiveRunning.showChat',
  },
  hideChat: {
    defaultMessage: 'hide chat',
    description: 'button to hide the chat during a jitsi live.',
    id: 'components.DashboardVideoLiveRunning.hideChat',
  },
});

interface DashboardVideoLiveRunningProps {
  video: Video;
}

export const DashboardVideoLiveRunning = ({
  video,
}: DashboardVideoLiveRunningProps) => {
  return (
    <Box direction="column" fill={true}>
      <Box direction="row">
        {video.live_type === LiveModeType.RAW && (
          <React.Fragment>
            <DashboardButtonWithLink
              label={<FormattedMessage {...messages.chatOnly} />}
              primary={false}
              to={CHAT_ROUTE()}
            />
            <DashboardButtonWithLink
              label={<FormattedMessage {...messages.showLive} />}
              primary={false}
              to={PLAYER_ROUTE(modelName.VIDEOS)}
            />
          </React.Fragment>
        )}
        <DashboardVideoLiveStopButton video={video} />
      </Box>
      {video.live_type === LiveModeType.JITSI && (
        <React.Fragment>
          <DashboardJoinDiscussion />
          <Chat video={video} standalone={true} />
        </React.Fragment>
      )}
    </Box>
  );
};

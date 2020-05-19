import { Box, Button } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Video } from '../../types/tracks';
import { dashboardButtonStyles } from '../DashboardPaneButtons';

const messages = defineMessages({
  btnStartLive: {
    defaultMessage: 'Start a live streaming',
    description: 'Dashboard button to start a live streaming',
    id: 'components.Dashboard.DashboardPaneButtons.videos.btnStartLive',
  },
});

const LiveButton = styled(Button)`
  ${dashboardButtonStyles}
`;

/** Props shape for the DashboardVideoPaneButtons component. */
export interface DashboardVideoStartLiveButtonProps {
  video: Video;
}

export const DashboardVideoStartLiveButton = ({ video }: DashboardVideoStartLiveButtonProps) => {
  return <LiveButton 
    label={<FormattedMessage {...messages.btnStartLive} />}
  />;
};

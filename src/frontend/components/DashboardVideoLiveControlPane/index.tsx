import React from 'react';

import { Video } from 'types/tracks';
import { DashboardVideoLiveWidgetsContainer } from './widgets/DashboardVideoLiveWidgetsContainer';

interface DashboardVideoLiveControlPaneProps {
  video: Video;
}
/** This component will hold all the widgets in the futur, and will be displayed by DashboardVideoLive component */
export const DashboardVideoLiveControlPane = ({
  video,
}: DashboardVideoLiveControlPaneProps) => {
  video = video;
  return (
    <DashboardVideoLiveWidgetsContainer>
      {[]}
    </DashboardVideoLiveWidgetsContainer>
  );
};

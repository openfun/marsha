import React from 'react';

import { DashboardVideoLiveWidgetsContainer } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetsContainer';
import { DashboardVideoLiveWidgetGeneralTitle } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetGeneralTitle';
import { DashboardVideoLiveWidgetSchedulingAndDescription } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetSchedulingAndDescription';
import { Video } from 'types/tracks';

interface DashboardVideoLiveControlPaneProps {
  video: Video;
}

export const DashboardVideoLiveControlPane = ({
  video,
}: DashboardVideoLiveControlPaneProps) => {
  return (
    <DashboardVideoLiveWidgetsContainer>
      <DashboardVideoLiveWidgetGeneralTitle video={video} />
      <DashboardVideoLiveWidgetSchedulingAndDescription video={video} />
    </DashboardVideoLiveWidgetsContainer>
  );
};

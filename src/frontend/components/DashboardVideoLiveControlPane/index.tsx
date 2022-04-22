import React from 'react';

import { DashboardVideoLiveWidgetsContainer } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetsContainer';
import { DashboardVideoLiveWidgetGeneralTitle } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetGeneralTitle';
import { DashboardVideoLiveWidgetToolsAndApplications } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetToolsAndApplications';
import { DashboardVideoLiveWidgetSchedulingAndDescription } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetSchedulingAndDescription';
import { DashboardVideoLiveWidgetLivePairing } from './widgets/DashboardVideoLiveWidgetLivePairing';
import { Video } from 'types/tracks';

interface DashboardVideoLiveControlPaneProps {
  video: Video;
}

export const DashboardVideoLiveControlPane = ({
  video,
}: DashboardVideoLiveControlPaneProps) => {
  return (
    <DashboardVideoLiveWidgetsContainer>
      <DashboardVideoLiveWidgetToolsAndApplications video={video} />
      <DashboardVideoLiveWidgetGeneralTitle video={video} />
      <DashboardVideoLiveWidgetSchedulingAndDescription video={video} />
      <DashboardVideoLiveWidgetLivePairing video={video} />
    </DashboardVideoLiveWidgetsContainer>
  );
};

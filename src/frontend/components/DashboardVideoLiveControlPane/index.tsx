import React from 'react';

import { DashboardVideoLiveWidgetsContainer } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetsContainer';
import { DashboardVideoLiveWidgetGeneralTitle } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetGeneralTitle';
import { DashboardVideoLiveWidgetToolsAndApplications } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetToolsAndApplications';
import { DashboardVideoLiveWidgetLivePairing } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetLivePairing';
import { DashboardVideoLiveWidgetSchedulingAndDescription } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetSchedulingAndDescription';
import { DashboardVideoLiveWidgetVisibilityAndInteraction } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetVisibilityAndInteraction';
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
      <DashboardVideoLiveWidgetVisibilityAndInteraction video={video} />
      <DashboardVideoLiveWidgetSchedulingAndDescription video={video} />
      <DashboardVideoLiveWidgetLivePairing video={video} />
    </DashboardVideoLiveWidgetsContainer>
  );
};

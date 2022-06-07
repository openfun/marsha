import React from 'react';

import { DeleteUploadModalProvider } from 'data/stores/useDeleteUploadModal';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { Video } from 'types/tracks';

import { DashboardVideoLiveWidgetsContainer } from './widgets/DashboardVideoLiveWidgetsContainer';
import { DashboardVideoLiveWidgetGeneralTitle } from './widgets/DashboardVideoLiveWidgetGeneralTitle';
import { DashboardVideoLiveWidgetToolsAndApplications } from './widgets/DashboardVideoLiveWidgetToolsAndApplications';
import { DashboardVideoLiveWidgetJoinMode } from './widgets/DashboardVideoLiveWidgetJoinMode';
import { DashboardVideoLiveWidgetLivePairing } from './widgets/DashboardVideoLiveWidgetLivePairing';
import { DashboardVideoLiveWidgetSchedulingAndDescription } from './widgets/DashboardVideoLiveWidgetSchedulingAndDescription';
import { DashboardVideoLiveWidgetVisibilityAndInteraction } from './widgets/DashboardVideoLiveWidgetVisibilityAndInteraction';
import { DashboardVideoLiveWidgetVOD } from './widgets/DashboardVideoLiveWidgetVOD';
import { DashboardVideoLiveWidgetSharedLiveMedia } from './widgets/DashboardVideoLiveWidgetSharedLiveMedia';
import { PIPWidget } from './widgets/PIPWidget';

interface DashboardVideoLiveControlPaneProps {
  video: Video;
}

export const DashboardVideoLiveControlPane = ({
  video,
}: DashboardVideoLiveControlPaneProps) => {
  return (
    <InfoWidgetModalProvider value={null}>
      <DashboardVideoLiveWidgetsContainer>
        <DashboardVideoLiveWidgetToolsAndApplications video={video} />
        <DashboardVideoLiveWidgetGeneralTitle video={video} />
        <DashboardVideoLiveWidgetVisibilityAndInteraction video={video} />
        <DashboardVideoLiveWidgetSchedulingAndDescription video={video} />
        <DashboardVideoLiveWidgetLivePairing video={video} />
        <DashboardVideoLiveWidgetVOD video={video} />
        <DashboardVideoLiveWidgetJoinMode video={video} />
        <DeleteUploadModalProvider value={null}>
          <DashboardVideoLiveWidgetSharedLiveMedia video={video} />
        </DeleteUploadModalProvider>
        <PIPWidget />
      </DashboardVideoLiveWidgetsContainer>
    </InfoWidgetModalProvider>
  );
};

import React from 'react';

import { DashboardVideoLiveWidgetsContainer } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetsContainer';
import { DashboardVideoLiveWidgetGeneralTitle } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetGeneralTitle';
import { DashboardVideoLiveWidgetJoinMode } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetJoinMode';
import { DashboardVideoLiveWidgetLivePairing } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetLivePairing';
import { DashboardVideoLiveWidgetSchedulingAndDescription } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetSchedulingAndDescription';
import { DashboardVideoLiveWidgetThumbnail } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetThumbnail';
import { DashboardVideoLiveWidgetToolsAndApplications } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetToolsAndApplications';
import { DashboardVideoLiveWidgetVisibilityAndInteraction } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetVisibilityAndInteraction';
import { DashboardVideoLiveWidgetVOD } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetVOD';
import { DashboardVideoLiveWidgetSharedLiveMedia } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetSharedLiveMedia';
import { DeleteUploadModalProvider } from 'data/stores/useDeleteUploadModal';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';

export const DashboardVideoLiveTabConfiguration = () => {
  return (
    <InfoWidgetModalProvider value={null}>
      <DashboardVideoLiveWidgetsContainer>
        <DashboardVideoLiveWidgetToolsAndApplications />
        <DashboardVideoLiveWidgetGeneralTitle />
        <DashboardVideoLiveWidgetVisibilityAndInteraction />
        <DashboardVideoLiveWidgetSchedulingAndDescription />
        <DashboardVideoLiveWidgetLivePairing />
        <DashboardVideoLiveWidgetVOD />
        <DashboardVideoLiveWidgetJoinMode />
        <DashboardVideoLiveWidgetThumbnail />
        <DeleteUploadModalProvider value={null}>
          <DashboardVideoLiveWidgetSharedLiveMedia />
        </DeleteUploadModalProvider>
      </DashboardVideoLiveWidgetsContainer>
    </InfoWidgetModalProvider>
  );
};

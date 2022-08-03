import React from 'react';

import { SharedLiveMediaModalWrapper } from 'components/DashboardLiveControlPane/customs/SharedLiveMediaModalWrapper';
import { DashboardLiveWidgetsContainer } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetsContainer';
import { DashboardLiveWidgetGeneralTitle } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetGeneralTitle';
import { DashboardLiveWidgetJoinMode } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetJoinMode';
import { DashboardLiveWidgetLivePairing } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetLivePairing';
import { DashboardLiveWidgetSchedulingAndDescription } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetSchedulingAndDescription';
import { DashboardLiveWidgetThumbnail } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetThumbnail';
import { DashboardLiveWidgetToolsAndApplications } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetToolsAndApplications';
import { DashboardLiveWidgetVisibilityAndInteraction } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetVisibilityAndInteraction';
import { DashboardLiveWidgetVOD } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetVOD';
import { DashboardLiveWidgetSharedLiveMedia } from 'components/DashboardLiveControlPane/widgets/DashboardLiveWidgetSharedLiveMedia';
import { DeleteSharedLiveMediaModalProvider } from 'data/stores/useDeleteSharedLiveMediaModal';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';

export const DashboardLiveTabConfiguration = () => {
  return (
    <InfoWidgetModalProvider value={null}>
      <DeleteSharedLiveMediaModalProvider value={null}>
        <SharedLiveMediaModalWrapper />
        <DashboardLiveWidgetsContainer>
          <DashboardLiveWidgetToolsAndApplications />
          <DashboardLiveWidgetGeneralTitle />
          <DashboardLiveWidgetVisibilityAndInteraction />
          <DashboardLiveWidgetSchedulingAndDescription />
          <DashboardLiveWidgetLivePairing />
          <DashboardLiveWidgetVOD />
          <DashboardLiveWidgetJoinMode />
          <DashboardLiveWidgetThumbnail />
          <DashboardLiveWidgetSharedLiveMedia />
        </DashboardLiveWidgetsContainer>
      </DeleteSharedLiveMediaModalProvider>
    </InfoWidgetModalProvider>
  );
};

import React from 'react';

import { SharedLiveMediaModalWrapper } from 'components/DashboardLive/DashboardLiveControlPane/components/SharedLiveMediaModalWrapper';
import { WidgetsContainer } from 'components/common/dashboard/widgets/WidgetsContainer';
import { DashboardLiveWidgetGeneralTitle } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetGeneralTitle';
import { DashboardLiveWidgetJoinMode } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetJoinMode';
import { DashboardLiveWidgetLivePairing } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetLivePairing';
import { DashboardLiveWidgetSchedulingAndDescription } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetSchedulingAndDescription';
import { WidgetThumbnail } from 'components/common/dashboard/widgets/WidgetThumbnail';
import { DashboardLiveWidgetToolsAndApplications } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetToolsAndApplications';
import { DashboardLiveWidgetVisibilityAndInteraction } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetVisibilityAndInteraction';
import { DashboardLiveWidgetVOD } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetVOD';
import { DashboardLiveWidgetSharedLiveMedia } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetSharedLiveMedia';
import { DeleteSharedLiveMediaModalProvider } from 'data/stores/useDeleteSharedLiveMediaModal';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';

export const DashboardLiveTabConfiguration = () => {
  return (
    <InfoWidgetModalProvider value={null}>
      <DeleteSharedLiveMediaModalProvider value={null}>
        <SharedLiveMediaModalWrapper />
        <WidgetsContainer>
          <DashboardLiveWidgetToolsAndApplications />
          <DashboardLiveWidgetGeneralTitle />
          <DashboardLiveWidgetVisibilityAndInteraction />
          <DashboardLiveWidgetSchedulingAndDescription />
          <DashboardLiveWidgetLivePairing />
          <DashboardLiveWidgetVOD />
          <DashboardLiveWidgetJoinMode />
          <WidgetThumbnail />
          <DashboardLiveWidgetSharedLiveMedia />
        </WidgetsContainer>
      </DeleteSharedLiveMediaModalProvider>
    </InfoWidgetModalProvider>
  );
};

import React from 'react';

import { SharedLiveMediaModalWrapper } from 'components/DashboardLive/DashboardLiveControlPane/customs/SharedLiveMediaModalWrapper';
import { DashboardLiveWidgetsContainer } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetsContainer';
import { DashboardLiveWidgetGeneralTitle } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetGeneralTitle';
import { DashboardLiveWidgetJoinMode } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetJoinMode';
import { DashboardLiveWidgetLivePairing } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetLivePairing';
import { DashboardLiveWidgetSchedulingAndDescription } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetSchedulingAndDescription';
import { DashboardLiveWidgetThumbnail } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetThumbnail';
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

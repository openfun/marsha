import React from 'react';

import { SharedLiveMediaModalWrapper } from 'components/DashboardLive/DashboardLiveControlPane/components/SharedLiveMediaModalWrapper';
import { WidgetsContainer } from 'components/common/dashboard/widgets/WidgetsContainer';
import { GeneralTitle } from 'components/DashboardLive/DashboardLiveControlPane/widgets/GeneralTitle';
import { LiveJoinMode } from 'components/DashboardLive/DashboardLiveControlPane/widgets/LiveJoinMode';
import { LivePairing } from 'components/DashboardLive/DashboardLiveControlPane/widgets/LivePairing';
import { SchedulingAndDescription } from 'components/DashboardLive/DashboardLiveControlPane/widgets/SchedulingAndDescription';
import { WidgetThumbnail } from 'components/common/dashboard/widgets/WidgetThumbnail';
import { ToolsAndApplications } from 'components/DashboardLive/DashboardLiveControlPane/widgets/ToolsAndApplications';
import { VisibilityAndInteraction } from 'components/DashboardLive/DashboardLiveControlPane/widgets/VisibilityAndInteraction';
import { VODCreation } from 'components/DashboardLive/DashboardLiveControlPane/widgets/VODCreation';
import { SharedLiveMedia } from 'components/DashboardLive/DashboardLiveControlPane/widgets/SharedLiveMedia';
import { DeleteSharedLiveMediaModalProvider } from 'data/stores/useDeleteSharedLiveMediaModal';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';

export const DashboardLiveTabConfiguration = () => {
  return (
    <InfoWidgetModalProvider value={null}>
      <DeleteSharedLiveMediaModalProvider value={null}>
        <SharedLiveMediaModalWrapper />
        <WidgetsContainer>
          <ToolsAndApplications />
          <GeneralTitle />
          <VisibilityAndInteraction />
          <SchedulingAndDescription />
          <LivePairing />
          <VODCreation />
          <LiveJoinMode />
          <WidgetThumbnail />
          <SharedLiveMedia />
        </WidgetsContainer>
      </DeleteSharedLiveMediaModalProvider>
    </InfoWidgetModalProvider>
  );
};

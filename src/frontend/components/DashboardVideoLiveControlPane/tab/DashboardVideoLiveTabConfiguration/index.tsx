import React from 'react';

import { SharedLiveMediaModalWrapper } from 'components/DashboardVideoLiveControlPane/customs/SharedLiveMediaModalWrapper';
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
import { DeleteSharedLiveMediaUploadModalProvider } from 'data/stores/useDeleteSharedLiveMediaUploadModal';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { Video } from 'types/tracks';

interface DashboardVideoLiveTabConfigurationProps {
  video: Video;
}
export const DashboardVideoLiveTabConfiguration = ({
  video,
}: DashboardVideoLiveTabConfigurationProps) => {
  return (
    <InfoWidgetModalProvider value={null}>
      <DeleteSharedLiveMediaUploadModalProvider value={null}>
        <SharedLiveMediaModalWrapper />
        <DashboardVideoLiveWidgetsContainer>
          <DashboardVideoLiveWidgetToolsAndApplications video={video} />
          <DashboardVideoLiveWidgetGeneralTitle video={video} />
          <DashboardVideoLiveWidgetVisibilityAndInteraction video={video} />
          <DashboardVideoLiveWidgetSchedulingAndDescription video={video} />
          <DashboardVideoLiveWidgetLivePairing video={video} />
          <DashboardVideoLiveWidgetVOD video={video} />
          <DashboardVideoLiveWidgetJoinMode video={video} />
          <DashboardVideoLiveWidgetThumbnail />
          <DashboardVideoLiveWidgetSharedLiveMedia video={video} />
        </DashboardVideoLiveWidgetsContainer>
      </DeleteSharedLiveMediaUploadModalProvider>
    </InfoWidgetModalProvider>
  );
};

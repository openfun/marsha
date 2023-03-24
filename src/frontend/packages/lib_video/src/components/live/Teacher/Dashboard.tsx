import { Live } from 'lib-components';
import React from 'react';

import { VideoWebSocketInitializer } from '@lib-video/components/common/VideoWebSocketInitializer';
import { ConverseInitializer } from '@lib-video/components/live/common/ConverseInitializer';
import {
  CurrentLiveProvider,
  CurrentVideoProvider,
} from '@lib-video/hooks/useCurrentVideo';
import { JitsiApiProvider } from '@lib-video/hooks/useJitsiApi';
import { LiveFeedbackProvider } from '@lib-video/hooks/useLiveFeedback';
import { LiveModaleConfigurationProvider } from '@lib-video/hooks/useLiveModale';
import { PictureInPictureProvider } from '@lib-video/hooks/usePictureInPicture';

import { TeacherLiveWrapper } from './Wrapper';

interface DashboardProps {
  live: Live;
  socketUrl: string;
}

export const Dashboard = ({ live, socketUrl }: DashboardProps) => {
  return (
    <CurrentVideoProvider value={live}>
      <CurrentLiveProvider value={live}>
        <PictureInPictureProvider value={{ reversed: true }}>
          <JitsiApiProvider value={undefined}>
            <LiveModaleConfigurationProvider value={null}>
              <VideoWebSocketInitializer url={socketUrl} videoId={live.id}>
                <ConverseInitializer>
                  <LiveFeedbackProvider value={false}>
                    <TeacherLiveWrapper />
                  </LiveFeedbackProvider>
                </ConverseInitializer>
              </VideoWebSocketInitializer>
            </LiveModaleConfigurationProvider>
          </JitsiApiProvider>
        </PictureInPictureProvider>
      </CurrentLiveProvider>
    </CurrentVideoProvider>
  );
};

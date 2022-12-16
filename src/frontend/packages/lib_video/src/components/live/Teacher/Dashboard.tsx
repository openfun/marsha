import { Live } from 'lib-components';
import React from 'react';

import { VideoWebSocketInitializer } from 'components/common/VideoWebSocketInitializer';
import { ConverseInitializer } from 'components/live/common/ConverseInitializer';
import {
  CurrentLiveProvider,
  CurrentVideoProvider,
} from 'hooks/useCurrentVideo';
import { JitsiApiProvider } from 'hooks/useJitsiApi';
import { LiveFeedbackProvider } from 'hooks/useLiveFeedback';
import { LiveModaleConfigurationProvider } from 'hooks/useLiveModale';
import { PictureInPictureProvider } from 'hooks/usePictureInPicture';

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

import { Stack } from 'grommet';
import React, { Dispatch, SetStateAction } from 'react';

import { PictureInPictureLayer } from 'components/common/PictureInPictureLayer';
import { AudioControl } from 'components/live/common/JitsiControls/AudioControl';
import { CameraControl } from 'components/live/common/JitsiControls/CameraControl';
import { LiveModale } from 'components/live/common/LiveModale';
import { SharedMediaExplorer } from 'components/live/common/SharedMediaExplorer';
import { useCurrentLive } from 'hooks/useCurrentVideo';
import { useLiveModaleConfiguration } from 'hooks/useLiveModale';
import { usePictureInPicture } from 'hooks/usePictureInPicture';

import { TeacherLiveContent } from './TeacherLiveContent';
import { TeacherPIPControls } from './TeacherPIPControls';

interface MainContentProps {
  setCanShowStartButton: Dispatch<SetStateAction<boolean>>;
  setCanStartLive: Dispatch<SetStateAction<boolean>>;
}

export const MainContent = ({
  setCanShowStartButton,
  setCanStartLive,
}: MainContentProps) => {
  const live = useCurrentLive();
  const [pipState] = usePictureInPicture();
  const [modaleConfiguration] = useLiveModaleConfiguration();

  if (live.active_shared_live_media && !live.active_shared_live_media.urls) {
    throw new Error('Missing active shared live media urls');
  }

  return (
    <Stack fill interactiveChild="last">
      <PictureInPictureLayer
        mainElement={
          <TeacherLiveContent
            setCanShowStartButton={setCanShowStartButton}
            setCanStartLive={setCanStartLive}
          />
        }
        secondElement={
          live.active_shared_live_media &&
          live.active_shared_live_media.urls ? (
            <SharedMediaExplorer
              initialPage={1}
              pages={live.active_shared_live_media.urls.pages}
            >
              {live.active_shared_live_media.nb_pages &&
                live.active_shared_live_media.nb_pages > 1 && (
                  <TeacherPIPControls
                    maxPage={live.active_shared_live_media.nb_pages}
                  />
                )}
            </SharedMediaExplorer>
          ) : null
        }
        reversed={pipState.reversed}
        pictureActions={
          pipState.reversed
            ? [
                <AudioControl key="audio_control" />,
                <CameraControl key="camera_control" />,
              ]
            : undefined
        }
      />
      {modaleConfiguration && <LiveModale {...modaleConfiguration} />}
    </Stack>
  );
};

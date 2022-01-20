import React, { useEffect, useState } from 'react';

import { DashboardTimedTextPane } from 'components/DashboardTimedTextPane';
import { DashboardVideoPane } from 'components/DashboardVideoPane';
import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { useVideo } from 'data/stores/useVideo';
import { initVideoWebsocket } from 'data/websocket';
import { uploadState, Video } from 'types/tracks';

interface DashboardVideoProps {
  video: Video;
}

const DashboardVideo = (props: DashboardVideoProps) => {
  const video = useVideo((state) => state.getVideo(props.video));
  const { uploadManagerState } = useUploadManager();
  const [displayTimedTextPane, setDisplayTimedTextPane] = useState(false);
  initVideoWebsocket(video);

  useEffect(() => {
    setDisplayTimedTextPane(
      video.live_state === null &&
        (![
          uploadState.DELETED,
          uploadState.HARVESTED,
          uploadState.HARVESTING,
          uploadState.PENDING,
        ].includes(video.upload_state) ||
          (video.upload_state === uploadState.PENDING &&
            (uploadManagerState[video.id]?.status ===
              UploadManagerStatus.UPLOADING ||
              uploadManagerState[video.id]?.status ===
                UploadManagerStatus.SUCCESS))),
    );
  }, [video.live_state, video.upload_state, uploadManagerState]);

  return (
    <React.Fragment>
      <DashboardVideoPane video={video} />
      {displayTimedTextPane && <DashboardTimedTextPane />}
    </React.Fragment>
  );
};

export default DashboardVideo;

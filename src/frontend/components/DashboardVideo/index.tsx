import React from 'react';

import { DashboardTimedTextPane } from 'components/DashboardTimedTextPane';
import { DashboardVideoPane } from 'components/DashboardVideoPane';
import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { useVideo } from 'data/stores/useVideo';
import { uploadState, Video } from 'types/tracks';

interface DashboardVideoProps {
  video: Video;
}

const DashboardVideo = (props: DashboardVideoProps) => {
  const video = useVideo((state) => state.getVideo(props.video));
  const { uploadManagerState } = useUploadManager();

  const displayTimedTextPane =
    ![
      uploadState.DELETED,
      uploadState.HARVESTED,
      uploadState.HARVESTING,
      uploadState.PENDING,
    ].includes(video.upload_state) ||
    (video.upload_state === uploadState.PENDING &&
      (uploadManagerState[video.id]?.status === UploadManagerStatus.UPLOADING ||
        uploadManagerState[video.id]?.status === UploadManagerStatus.SUCCESS));

  return (
    <React.Fragment>
      <DashboardVideoPane video={video} />
      {displayTimedTextPane && <DashboardTimedTextPane />}
    </React.Fragment>
  );
};

export default DashboardVideo;

import React from 'react';

import { DashboardTimedTextPane } from 'components/DashboardTimedTextPane';
import { DashboardVideoPane } from 'components/DashboardVideoPane';
import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { uploadState } from 'types/tracks';

export const DashboardVideo = () => {
  const video = useCurrentVideo();
  const { uploadManagerState } = useUploadManager();

  const displayTimedTextPane =
    ![uploadState.DELETED, uploadState.PENDING].includes(video.upload_state) ||
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

import { Nullable } from 'lib-common';
import React, { useState } from 'react';

import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { uploadState } from 'types/tracks';

import { UploadVideoDropzone } from './UploadVideoDropzone';
import { UploadVideoPreview } from './UploadVideoPreview';
import { UploadVideoProgress } from './UploadVideoProgress';
import { UploadVideoRetry } from './UploadVideoRetry';

interface UploadVideoFormProps {
  onRetry: () => void;
  setVideoFile: (videoFile: Nullable<File>) => void;
}

export const UploadVideoForm = ({
  onRetry,
  setVideoFile,
}: UploadVideoFormProps) => {
  const video = useCurrentVideo();
  const { resetUpload, uploadManagerState } = useUploadManager();
  const [src, setSrc] = useState<Nullable<string>>(null);

  if (!src) {
    return (
      <UploadVideoDropzone
        setVideoFile={(videoFile) => {
          setVideoFile(videoFile);
          setSrc(URL.createObjectURL(videoFile));
        }}
      />
    );
  }

  if (
    uploadManagerState[video.id] &&
    uploadManagerState[video.id].status !== UploadManagerStatus.SUCCESS
  ) {
    if (
      uploadManagerState[video.id].status === UploadManagerStatus.ERR_UPLOAD ||
      video.upload_state === uploadState.ERROR
    ) {
      return (
        <UploadVideoRetry
          onClickRetry={() => {
            setVideoFile(null);
            setSrc(null);
            resetUpload(video.id);
            onRetry();
          }}
        />
      );
    } else {
      return (
        <UploadVideoProgress progress={uploadManagerState[video.id].progress} />
      );
    }
  } else {
    return (
      <UploadVideoPreview
        onClickRemoveButton={() => {
          setVideoFile(null);
          setSrc(null);
        }}
        videoSrc={src}
      />
    );
  }
};

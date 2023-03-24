import { Nullable } from 'lib-common';
import {
  UploadManagerStatus,
  useUploadManager,
  uploadState,
} from 'lib-components';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';

import { useVideoMetadata } from '@lib-video/api';

import { UploadVideoDropzone } from './UploadVideoDropzone';
import { UploadVideoPreview } from './UploadVideoPreview';
import { UploadVideoProgress } from './UploadVideoProgress';
import { UploadVideoRetry } from './UploadVideoRetry';

interface UploadVideoFormProps {
  onRetry: () => void;
  setVideoFile: (videoFile: Nullable<File>) => void;
  videoId?: string;
  videoUploadState?: uploadState;
}

export const UploadVideoForm = ({
  onRetry,
  setVideoFile,
  videoId,
  videoUploadState,
}: UploadVideoFormProps) => {
  const intl = useIntl();
  const metadata = useVideoMetadata(intl.locale);
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
    videoId &&
    uploadManagerState[videoId] &&
    uploadManagerState[videoId].status !== UploadManagerStatus.SUCCESS
  ) {
    if (uploadManagerState[videoId].status === UploadManagerStatus.ERR_SIZE) {
      return (
        <UploadVideoRetry
          onClickRetry={() => {
            setVideoFile(null);
            setSrc(null);
            resetUpload(videoId);
            onRetry();
          }}
          maxSize={metadata.data?.vod.upload_max_size_bytes}
        />
      );
    }
    if (
      uploadManagerState[videoId].status === UploadManagerStatus.ERR_UPLOAD ||
      videoUploadState === uploadState.ERROR
    ) {
      return (
        <UploadVideoRetry
          onClickRetry={() => {
            setVideoFile(null);
            setSrc(null);
            resetUpload(videoId);
            onRetry();
          }}
        />
      );
    } else {
      return (
        <UploadVideoProgress progress={uploadManagerState[videoId].progress} />
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

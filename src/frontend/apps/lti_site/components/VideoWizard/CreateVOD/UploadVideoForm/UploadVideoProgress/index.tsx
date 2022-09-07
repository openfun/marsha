import React from 'react';

import { ProgressionBar } from 'components/graphicals/ProgressionBar';
import { BigDashedBox } from 'components/VideoWizard/CreateVOD/UploadVideoForm/BigDashedBox';

interface UploadVideoProgressProps {
  progress: number;
}

export const UploadVideoProgress = ({ progress }: UploadVideoProgressProps) => {
  return (
    <BigDashedBox>
      <ProgressionBar progressPercentage={progress} />
    </BigDashedBox>
  );
};

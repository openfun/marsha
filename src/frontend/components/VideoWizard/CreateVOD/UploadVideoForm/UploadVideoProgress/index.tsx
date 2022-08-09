import React from 'react';

import { BigDashedBox } from 'components/VideoWizard/CreateVOD/UploadVideoForm/BigDashedBox';
import { ProgressionBar } from 'components/common/dashboard/widgets/components/ProgressionBar';

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

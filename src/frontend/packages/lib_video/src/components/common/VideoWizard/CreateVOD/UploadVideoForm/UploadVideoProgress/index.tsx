import { ProgressionBar } from 'lib-components';
import React from 'react';

import { BigDashedBox } from '../BigDashedBox';

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

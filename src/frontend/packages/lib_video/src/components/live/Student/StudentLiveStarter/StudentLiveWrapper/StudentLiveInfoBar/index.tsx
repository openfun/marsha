import { Nullable } from 'lib-common';
import { Box } from 'lib-components';
import React from 'react';

import { VideoInfoBar } from '@lib-video/components/common/VideoInfoBar';

interface StudentLiveInfoBarProps {
  startDate: Nullable<string>;
}

export const StudentLiveInfoBar = ({ startDate }: StudentLiveInfoBarProps) => {
  return (
    <Box gap="xsmall">
      <VideoInfoBar isTeacher={false} startDate={startDate} />
    </Box>
  );
};

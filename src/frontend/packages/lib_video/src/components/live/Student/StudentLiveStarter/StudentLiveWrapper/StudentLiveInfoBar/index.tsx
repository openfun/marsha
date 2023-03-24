import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import React from 'react';

import { VideoInfoBar } from '@lib-video/components/common/VideoInfoBar';

interface StudentLiveInfoBarProps {
  startDate: Nullable<string>;
}

export const StudentLiveInfoBar = ({ startDate }: StudentLiveInfoBarProps) => {
  return (
    <Box direction="column" flex style={{ minWidth: '0' }}>
      <VideoInfoBar isTeacher={false} startDate={startDate} />
    </Box>
  );
};

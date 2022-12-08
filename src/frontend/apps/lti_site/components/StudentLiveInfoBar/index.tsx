import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import React from 'react';

import { LiveInfoBar } from 'components/LiveInfoBar';

interface StudentLiveInfoBarProps {
  startDate: Nullable<string>;
}

export const StudentLiveInfoBar = ({ startDate }: StudentLiveInfoBarProps) => {
  return (
    <Box direction="column" flex style={{ minWidth: '0' }}>
      <LiveInfoBar isTeacher={false} startDate={startDate} />
    </Box>
  );
};

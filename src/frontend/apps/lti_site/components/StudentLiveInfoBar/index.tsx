import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import React from 'react';

import { LiveInfoBar } from 'components/LiveInfoBar';

interface StudentLiveInfoBarProps {
  title: string;
  startDate: Nullable<string>;
}

export const StudentLiveInfoBar = ({
  title,
  startDate,
}: StudentLiveInfoBarProps) => {
  return (
    <Box direction="column" flex style={{ minWidth: '0' }}>
      <LiveInfoBar title={title} startDate={startDate} />
    </Box>
  );
};

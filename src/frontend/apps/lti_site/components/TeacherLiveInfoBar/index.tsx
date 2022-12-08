import { LiveInfoBar } from 'components/LiveInfoBar';
import { Box, BoxProps } from 'grommet';
import { Nullable } from 'lib-common';
import React from 'react';

interface TeacherLiveInfoBarProps extends BoxProps {
  startDate: Nullable<string>;
}

export const TeacherLiveInfoBar = ({
  startDate,
  ...props
}: TeacherLiveInfoBarProps) => {
  return (
    <Box
      direction="column"
      style={{ flexBasis: '0%', minWidth: '0' }}
      {...props}
    >
      <LiveInfoBar isTeacher startDate={startDate} />
    </Box>
  );
};

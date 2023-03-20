import { Box, BoxProps } from 'grommet';
import { Nullable } from 'lib-common';
import React from 'react';

import { VideoInfoBar } from '../VideoInfoBar';

interface TeacherVideoInfoBarProps extends BoxProps {
  startDate: Nullable<string>;
}

export const TeacherVideoInfoBar = ({
  startDate,
  ...props
}: TeacherVideoInfoBarProps) => {
  return (
    <Box
      direction="column"
      justify="center"
      style={{ flex: 'auto' }}
      {...props}
    >
      <VideoInfoBar isTeacher startDate={startDate} />
    </Box>
  );
};

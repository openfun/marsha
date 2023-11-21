import { Nullable } from 'lib-common';
import { Box, BoxProps } from 'lib-components';
import React from 'react';

import { VideoInfoBar } from '../VideoInfoBar';

interface TeacherVideoInfoBarProps extends BoxProps<'div'> {
  startDate: Nullable<string>;
}

export const TeacherVideoInfoBar = ({
  startDate,
  ...props
}: TeacherVideoInfoBarProps) => {
  return (
    <Box justify="center" flex="auto" gap="xsmall" {...props}>
      <VideoInfoBar isTeacher startDate={startDate} />
    </Box>
  );
};

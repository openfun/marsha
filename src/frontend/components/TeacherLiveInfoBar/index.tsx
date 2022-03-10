import { Box, BoxProps, Heading, Paragraph } from 'grommet';
import React from 'react';
import { Nullable } from 'utils/types';

interface TeacherLiveInfoBarProps extends BoxProps {
  title: string;
  startDate: Nullable<string>;
}

export const TeacherLiveInfoBar = ({
  title,
  startDate,
  ...props
}: TeacherLiveInfoBarProps) => {
  return (
    <Box direction="column" style={{ minWidth: '0' }} {...props}>
      <Heading
        color="blue-active"
        level="2"
        margin={{ bottom: 'small' }}
        size="small"
        truncate
        style={{ maxWidth: '100%' }}
      >
        {title}
      </Heading>

      <Box direction="row">
        {startDate && (
          <Paragraph
            color="blue-active"
            margin={{ right: 'large', bottom: 'none' }}
            size="small"
          >
            {/* video.started_at */}
            {startDate}
          </Paragraph>
        )}
      </Box>
    </Box>
  );
};

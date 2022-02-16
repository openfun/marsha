import { Box, Heading, Paragraph } from 'grommet';
import React from 'react';
import { Nullable } from 'utils/types';

interface TeacherLiveInfoBarProps {
  title: string;
  startDate: Nullable<string>;
}

export const TeacherLiveInfoBar = ({
  title,
  startDate,
}: TeacherLiveInfoBarProps) => {
  return (
    <Box direction="column" flex>
      <Heading
        color="blue-active"
        level="2"
        margin={{ bottom: 'small' }}
        size="small"
        truncate
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

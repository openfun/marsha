import React from 'react';
import { Box, Paragraph, Heading } from 'grommet';

import { Nullable } from 'utils/types';

interface StudentLiveInfoBarProps {
  title: string;
  startDate: Nullable<string>;
}

export const StudentLiveInfoBar = ({
  title,
  startDate,
}: StudentLiveInfoBarProps) => {
  return (
    <Box direction="column">
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
        <Paragraph
          color="blue-active"
          margin={{ right: 'large', bottom: 'none' }}
          size="small"
        >
          {/* video.started_at */}
          {startDate}
        </Paragraph>
      </Box>
    </Box>
  );
};

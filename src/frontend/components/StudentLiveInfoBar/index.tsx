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
    <Box direction="column" flex style={{ minWidth: '0' }}>
      <Heading
        a11yTitle={title}
        color="blue-active"
        level="1"
        margin={{ bottom: 'small' }}
        size="1.3rem"
        title={title}
        truncate
        style={{ maxWidth: '100%' }}
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

import React from 'react';
import { Box, Paragraph, Heading } from 'grommet';

import { Nullable } from 'utils/types';

interface StudentLiveInfoBarProps {
  title: Nullable<string>;
  startDate: Nullable<string>;
}

export const StudentLiveInfoBar = ({
  title,
  startDate,
}: StudentLiveInfoBarProps) => {
  return (
    <Box direction="column" flex style={{ minWidth: '0' }}>
      {title && (
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
      )}

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

import React, { useContext } from 'react';
import { Box, Paragraph, Heading, ResponsiveContext } from 'grommet';

import { Nullable } from 'utils/types';

interface StudentLiveInfoBarProps {
  title: string;
  startDate: Nullable<string>;
}

export const StudentLiveInfoBar = ({
  title,
  startDate,
}: StudentLiveInfoBarProps) => {
  const size = useContext(ResponsiveContext);

  return (
    <Box
      direction="column"
      margin={size === 'small' ? { bottom: 'large' } : { bottom: 'none' }}
    >
      <Heading
        level="2"
        margin={{ bottom: 'small' }}
        size="small"
        color="blue-active"
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

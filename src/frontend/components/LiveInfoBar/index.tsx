import { useParticipantsStore } from 'data/stores/useParticipantsStore';
import { Box, Heading, Paragraph } from 'grommet';
import React, { Fragment } from 'react';

import { Nullable } from 'utils/types';

interface LiveInfoBarProps {
  title: string;
  startDate: Nullable<string>;
}

export const LiveInfoBar = ({ title, startDate }: LiveInfoBarProps) => {
  const participants = useParticipantsStore((state) => state.participants);
  return (
    <Fragment>
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
        {participants.length > 0 && (
          <Paragraph
            color="blue-active"
            margin={{ right: 'large', bottom: 'none' }}
            size="small"
          >
            {`${participants.length} viewers connected.`}
          </Paragraph>
        )}
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
    </Fragment>
  );
};

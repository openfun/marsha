import { Box, BoxProps, Heading, Paragraph } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Nullable } from 'utils/types';

const messages = defineMessages({
  noTitle: {
    defaultMessage: 'No title',
    description: 'Title placeholder when no title is defined for this live',
    id: 'components.TeacherLiveInfobar.noTitle',
  },
});

interface TeacherLiveInfoBarProps extends BoxProps {
  title: Nullable<string>;
  startDate: Nullable<string>;
}

export const TeacherLiveInfoBar = ({
  title,
  startDate,
  ...props
}: TeacherLiveInfoBarProps) => {
  const intl = useIntl();

  return (
    <Box
      direction="column"
      style={{ flexBasis: '0%', minWidth: '0' }}
      {...props}
    >
      <Heading
        color="blue-active"
        level="2"
        margin={{ bottom: 'small' }}
        size="small"
        truncate
        style={{ maxWidth: '100%' }}
      >
        {title || intl.formatMessage(messages.noTitle)}
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

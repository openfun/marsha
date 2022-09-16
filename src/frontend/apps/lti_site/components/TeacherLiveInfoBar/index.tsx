import { LiveInfoBar } from 'components/LiveInfoBar';
import { Box, BoxProps } from 'grommet';
import { Nullable } from 'lib-common';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

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
  const liveTitle = title || intl.formatMessage(messages.noTitle);
  return (
    <Box
      direction="column"
      style={{ flexBasis: '0%', minWidth: '0' }}
      {...props}
    >
      <LiveInfoBar title={liveTitle} startDate={startDate} />
    </Box>
  );
};

import { Box, Text } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  recording: {
    defaultMessage: 'Recording',
    description:
      'Display message to let the user know that the live is recorded',
    id: 'components.StudentLiveRecordingInfo.recording',
  },
});

export const StudentLiveRecordingInfo = () => {
  const intl = useIntl();

  return (
    <Box
      direction="row"
      round="small"
      background="#002438"
      pad="xsmall"
      margin="xsmall"
    >
      <Box
        round="small"
        background="red"
        pad="xsmall"
        margin={{ right: 'xsmall' }}
      />
      <Text size="small">{intl.formatMessage(messages.recording)}</Text>
    </Box>
  );
};

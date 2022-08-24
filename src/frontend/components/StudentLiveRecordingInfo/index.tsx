import { Box, Text } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

const RecordingText = styled(Text)`
  font-size: 12px;
  line-height: 12px;
`;

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
      background={{ color: '#002438' }}
      pad="xsmall"
      margin="xsmall"
    >
      <Box
        round={true}
        background="red"
        pad="xsmall"
        margin={{ right: 'xsmall' }}
      />
      <RecordingText>{intl.formatMessage(messages.recording)}</RecordingText>
    </Box>
  );
};

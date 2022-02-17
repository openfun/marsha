import { Box, FormField, TextInput } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardButton } from 'components/DashboardPaneButtons/DashboardButtons';

const messages = defineMessages({
  label: {
    defaultMessage: 'Please enter your name to join the meeting',
    description: 'Label for asking username to join the meeting.',
    id: 'component.DashboardMeetingAskUsername.label',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description:
      'Button label for discarding ask username form in meeting dashboard view.',
    id: 'component.DashboardMeetingAskUsername.cancel',
  },
  join: {
    defaultMessage: 'Join',
    description:
      'Button label for setting username and joining the meeting in meeting dashboard view.',
    id: 'component.DashboardMeetingAskUsername.join',
  },
});

interface DashboardMeetingAskUsernameProps {
  userFullname: string;
  setUserFullname: (userFullname: string) => void;
  onJoin: () => void;
  onCancel?: () => void;
}

const DashboardMeetingAskUsername = ({
  userFullname,
  setUserFullname,
  onJoin,
  onCancel,
}: DashboardMeetingAskUsernameProps) => {
  const intl = useIntl();

  return (
    <Box pad="large" gap="medium">
      <FormField label={intl.formatMessage(messages.label)}>
        <TextInput
          value={userFullname}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setUserFullname(event.currentTarget.value);
          }}
        />
      </FormField>
      <Box direction="row" justify="center" margin={{ top: 'medium' }}>
        {onCancel && (
          <DashboardButton
            label={intl.formatMessage(messages.cancel)}
            onClick={onCancel}
          />
        )}
        <DashboardButton
          label={intl.formatMessage(messages.join)}
          onClick={onJoin}
          primary={true}
        />
      </Box>
    </Box>
  );
};

export default DashboardMeetingAskUsername;

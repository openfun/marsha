import { Box, FormField, TextInput } from 'grommet';
import { DashboardButton } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  label: {
    defaultMessage: 'Please enter your name to join the classroom',
    description: 'Label for asking username to join the classroom.',
    id: 'component.DashboardClassroomAskUsername.label',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description:
      'Button label for discarding ask username form in classroom dashboard view.',
    id: 'component.DashboardClassroomAskUsername.cancel',
  },
  join: {
    defaultMessage: 'Join',
    description:
      'Button label for setting username and joining the classroom in classroom dashboard view.',
    id: 'component.DashboardClassroomAskUsername.join',
  },
});

interface DashboardClassroomAskUsernameProps {
  userFullname: string;
  setUserFullname: (userFullname: string) => void;
  onJoin: () => void;
  onCancel?: () => void;
}

const DashboardClassroomAskUsername = ({
  userFullname,
  setUserFullname,
  onJoin,
  onCancel,
}: DashboardClassroomAskUsernameProps) => {
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

export default DashboardClassroomAskUsername;

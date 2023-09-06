import { Input } from '@openfun/cunningham-react';
import { Box, CheckBox, Text } from 'grommet';
import { Classroom, DashboardButton } from 'lib-components';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  label: {
    defaultMessage: 'Enter your name',
    description: 'Placeholder for asking username to join the classroom.',
    id: 'component.DashboardClassroomAskUsername.label',
  },
  infoInput: {
    defaultMessage: 'Please enter your name to join the classroom',
    description: 'Text info for asking username to join the classroom.',
    id: 'component.DashboardClassroomAskUsername.infoInput',
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
  studentConsent: {
    defaultMessage: 'Do you accept to be recorded ?',
    description:
      'Checkbox label for student consent to be recorded in classroom dashboard view.',
    id: 'component.DashboardClassroomAskUsername.studentConsent',
  },
});

interface DashboardClassroomAskUsernameProps {
  userFullname: string;
  setUserFullname: (userFullname: string) => void;
  onJoin: () => void;
  onCancel?: () => void;
}

const DashboardClassroomAskUsernameWrapper = ({
  userFullname,
  setUserFullname,
  children,
}: React.PropsWithChildren<
  Pick<DashboardClassroomAskUsernameProps, 'userFullname' | 'setUserFullname'>
>) => {
  const intl = useIntl();

  return (
    <Box pad="large" gap="medium" className="DashboardClassroomAskUsername">
      <Input
        aria-label={intl.formatMessage(messages.label)}
        label={intl.formatMessage(messages.label)}
        fullWidth
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setUserFullname(event.currentTarget.value);
        }}
        value={userFullname}
        text={intl.formatMessage(messages.infoInput)}
      />
      {children}
    </Box>
  );
};

type DashboardClassroomAskUsernameStudentProps = Omit<
  DashboardClassroomAskUsernameProps,
  'onCancel'
> & {
  isRecordingEnabled: Classroom['enable_recordings'];
  recordingPurpose: Classroom['recording_purpose'];
};

export const DashboardClassroomAskUsernameStudent = ({
  userFullname,
  setUserFullname,
  onJoin,
  isRecordingEnabled,
  recordingPurpose,
}: DashboardClassroomAskUsernameStudentProps) => {
  const intl = useIntl();
  const [isStudentConsentRecord, setIsStudentConsentRecord] = useState(
    !isRecordingEnabled,
  );

  return (
    <DashboardClassroomAskUsernameWrapper
      setUserFullname={setUserFullname}
      userFullname={userFullname}
    >
      <Box>
        {isRecordingEnabled && (
          <CheckBox
            checked={isStudentConsentRecord}
            onChange={() => setIsStudentConsentRecord(!isStudentConsentRecord)}
            label={
              <Text size="small">
                {intl.formatMessage(messages.studentConsent)}
              </Text>
            }
            aria-label={intl.formatMessage(messages.studentConsent)}
          />
        )}
        {isRecordingEnabled && recordingPurpose && (
          <Box
            margin={{ top: 'xsmall' }}
            pad="small"
            border={[
              { color: 'light-2', side: 'vertical' },
              { color: 'light-2', side: 'bottom' },
            ]}
            round="small"
          >
            <Text size="small" color="bg-lightgrey">
              {recordingPurpose}
            </Text>
          </Box>
        )}
      </Box>
      <Box direction="row" justify="center" margin={{ top: 'medium' }}>
        <DashboardButton
          label={intl.formatMessage(messages.join)}
          onClick={onJoin}
          primary={true}
          disabled={!isStudentConsentRecord || !userFullname}
        />
      </Box>
    </DashboardClassroomAskUsernameWrapper>
  );
};

export const DashboardClassroomAskUsername = ({
  userFullname,
  setUserFullname,
  onJoin,
  onCancel,
}: DashboardClassroomAskUsernameProps) => {
  const intl = useIntl();

  return (
    <DashboardClassroomAskUsernameWrapper
      setUserFullname={setUserFullname}
      userFullname={userFullname}
    >
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
          disabled={!userFullname}
        />
      </Box>
    </DashboardClassroomAskUsernameWrapper>
  );
};

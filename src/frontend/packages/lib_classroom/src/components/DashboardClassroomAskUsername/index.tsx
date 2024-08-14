import { colorsTokens } from '@lib-common/cunningham';
import { Button, Checkbox, Input } from '@openfun/cunningham-react';
import {
  Box,
  Classroom,
  LOCAL_STORAGE_KEYS,
  ModalButton,
  Text,
} from 'lib-components';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  labelEnterYourName: {
    defaultMessage: 'Enter your name',
    description: 'Input label for asking username to join the classroom.',
    id: 'component.DashboardClassroomAskUsername.labelEnterYourName',
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
  onJoin,
  children,
}: React.PropsWithChildren<
  Pick<
    DashboardClassroomAskUsernameProps,
    'userFullname' | 'setUserFullname' | 'onJoin'
  >
>) => {
  const intl = useIntl();
  const defaultUserName =
    userFullname ||
    localStorage.getItem(LOCAL_STORAGE_KEYS.CLASSROOM_USERNAME) ||
    '';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem(LOCAL_STORAGE_KEYS.CLASSROOM_USERNAME, userFullname);
    onJoin();
  };

  return (
    <Box pad="large" gap="medium" className="DashboardClassroomAskUsername">
      <form onSubmit={handleSubmit}>
        <Input
          aria-label={intl.formatMessage(messages.labelEnterYourName)}
          label={intl.formatMessage(messages.labelEnterYourName)}
          fullWidth
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setUserFullname(event.currentTarget.value);
          }}
          value={defaultUserName}
          text={intl.formatMessage(messages.infoInput)}
        />
        {children}
      </form>
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
  const [isStudentConsentRecord, setIsStudentConsentRecord] =
    useState(!isRecordingEnabled);

  return (
    <DashboardClassroomAskUsernameWrapper
      setUserFullname={setUserFullname}
      userFullname={userFullname}
      onJoin={onJoin}
    >
      <Box>
        {isRecordingEnabled && (
          <Checkbox
            checked={isStudentConsentRecord}
            onChange={() => setIsStudentConsentRecord(!isStudentConsentRecord)}
            label={intl.formatMessage(messages.studentConsent)}
            aria-label={intl.formatMessage(messages.studentConsent)}
          />
        )}
        {isRecordingEnabled && recordingPurpose && (
          <Box
            margin={{ top: 'xsmall' }}
            pad="small"
            style={{
              border: `solid ${colorsTokens['greyscale-200']} 1px`,
              borderTop: 'none',
            }}
            round="small"
          >
            <Text size="small" color="clr-greyscale-400">
              {recordingPurpose}
            </Text>
          </Box>
        )}
      </Box>
      <Box direction="row" justify="center" margin={{ top: 'medium' }}>
        <Button
          fullWidth
          aria-label={intl.formatMessage(messages.join)}
          disabled={!isStudentConsentRecord || !userFullname}
        >
          {intl.formatMessage(messages.join)}
        </Button>
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
      onJoin={onJoin}
    >
      <ModalButton
        onClickCancel={onCancel || undefined}
        disabled={!userFullname}
        labelCancel={intl.formatMessage(messages.cancel)}
        aria-label={intl.formatMessage(messages.join)}
      >
        {intl.formatMessage(messages.join)}
      </ModalButton>
    </DashboardClassroomAskUsernameWrapper>
  );
};

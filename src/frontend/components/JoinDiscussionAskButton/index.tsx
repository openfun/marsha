import { Box, Button, Layer, Text, TextInput } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Navigate } from 'react-router-dom';

import { useParticipantWorkflow } from '../../data/stores/useParticipantWorkflow';
import { DashboardButton } from '../DashboardPaneButtons/DashboardButtons';

import { converse } from '../../utils/window';
import { PUBLIC_JITSI_ROUTE } from '../PublicVideoLiveJitsi/route';

const messages = defineMessages({
  askInstructor: {
    defaultMessage: 'Send request to join the discussion',
    description: 'Ask the instructor to join the discussion',
    id: 'components.JoinDiscussionAskButton.askInstructor',
  },
  waitingInstructor: {
    defaultMessage: "Waiting for Instructor's response",
    description: `Text that replace the JoinDiscussion button before the instructor response.`,
    id: 'components.JoinDiscussionAskButton.waitingInstructor',
  },
  rejected: {
    defaultMessage:
      'Your request to join the discussion has not been accepted.',
    description: 'Text to tell participant his/her request is not accepted',
    id: 'components.JoinDiscussionAskButton.rejected',
  },
  chooseUsername: {
    defaultMessage: 'Choose a username',
    description:
      'Title displayed in the layer to ask the user to choose a username in order to connect to the chat',
    id: 'components.JoinDiscussionAskButton.chooseUsername',
  },
  UsernameAlreadyExists: {
    defaultMessage: 'Username already exists, please choose another one',
    description:
      'Error message shown when the connection to the chat failed if the username is already in use.',
    id: 'components.JoinDiscussionAskButton.usernameAlreadyExists',
  },
  username: {
    defaultMessage: 'username',
    description: 'label used by the input text to write the username to choose',
    id: 'components.JoinDiscussionAskButton.username',
  },
  confirm: {
    defaultMessage: 'Confirm',
    description: 'Label used by the confirm button',
    id: 'components.JoinDiscussionAskButton.confirm',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Label used by the cancel button',
    id: 'components.JoinDiscussionAskButton.cancel',
  },
});

export const JoinDiscussionAskButton = () => {
  const intl = useIntl();
  const [username, setUsername] = useState('');
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const {
    asked,
    accepted,
    rejected,
    usernameAlreadyExisting,
    reset,
    setAsked,
  } = useParticipantWorkflow((state) => ({
    asked: state.asked,
    accepted: state.accepted,
    rejected: state.rejected,
    usernameAlreadyExisting: state.usernameAlreadyExisting,
    setAsked: state.setAsked,
    reset: state.reset,
  }));

  useEffect(() => {
    if (usernameAlreadyExisting) {
      setShowUsernameForm(true);
    }
  }, [usernameAlreadyExisting]);

  const closeLayer = () => {
    setUsername('');
    setShowUsernameForm(false);
    reset();
  };

  const onClick = async () => {
    try {
      await converse.askParticipantToJoin(username);
      setAsked();
      if (showUsernameForm) {
        setShowUsernameForm(false);
      }
    } catch (error) {
      setShowUsernameForm(true);
    }
  };

  if (accepted) {
    return <Navigate to={PUBLIC_JITSI_ROUTE()} />;
  }

  if (rejected) {
    return <Text>{intl.formatMessage(messages.rejected)}</Text>;
  }

  if (showUsernameForm) {
    return (
      <Layer position="center" onClickOutside={closeLayer} onEsc={closeLayer}>
        <Box pad="large" gap="medium">
          <Text>{intl.formatMessage(messages.chooseUsername)}</Text>
          {usernameAlreadyExisting && (
            <Text color="status-error">
              {intl.formatMessage(messages.UsernameAlreadyExists)}
            </Text>
          )}
          <TextInput
            aria-label="username"
            name="username"
            type="text"
            placeholder={intl.formatMessage(messages.username)}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <Box align="center" direction="row" gap="medium">
            <Button
              label={intl.formatMessage(messages.confirm)}
              onClick={onClick}
              primary={true}
              disabled={!username.length}
            />
            <Button
              label={intl.formatMessage(messages.cancel)}
              onClick={closeLayer}
            />
          </Box>
        </Box>
      </Layer>
    );
  }

  return asked ? (
    <Text>{intl.formatMessage(messages.waitingInstructor)}</Text>
  ) : (
    <DashboardButton
      label={intl.formatMessage(messages.askInstructor)}
      primary={true}
      onClick={onClick}
    />
  );
};

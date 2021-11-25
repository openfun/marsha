import { Box, Button, Layer, Text, TextInput } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { PUBLIC_JITSI_ROUTE } from 'components/PublicVideoLiveJitsi/route';
import { JoinDiscussionSVG } from 'components/SVGIcons/JoinDiscussionSVG';
import { converse } from 'utils/window';
import toast from 'react-hot-toast';

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
    defaultMessage: 'Username',
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

export const StudentJoinDiscussionButton = () => {
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

  const closeUserNameForm = () => {
    setUsername('');
    setShowUsernameForm(false);
    reset();
  };

  const askToJoinDiscussion = async () => {
    try {
      //  alert teacher for the request through XMPP
      await converse.askParticipantToJoin(username);
    } catch (error) {
      //  when failling to alert the teacher
      setShowUsernameForm(true);
      return;
    }

    //  save the request in the store
    setAsked();
    //  hide the form
    setShowUsernameForm(false);
  };

  useEffect(() => {
    if (usernameAlreadyExisting) {
      setShowUsernameForm(true);
    }
  }, [usernameAlreadyExisting]);

  //  if user is rejected : alert user and reset state
  useEffect(() => {
    if (rejected) {
      reset();
      toast.error(intl.formatMessage(messages.rejected));
    }
  }, [rejected, reset]);

  if (accepted) {
    return <Redirect to={PUBLIC_JITSI_ROUTE()} />;
  }

  if (asked) {
    return <Text>{intl.formatMessage(messages.waitingInstructor)}</Text>;
  }

  return (
    <React.Fragment>
      {showUsernameForm && (
        <Layer
          position="center"
          onClickOutside={closeUserNameForm}
          onEsc={closeUserNameForm}
        >
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
                onClick={askToJoinDiscussion}
                primary={true}
                disabled={!username.length}
              />
              <Button
                label={intl.formatMessage(messages.cancel)}
                onClick={closeUserNameForm}
              />
            </Box>
          </Box>
        </Layer>
      )}

      <Button
        margin={{ right: 'medium', left: 'medium' }}
        onClick={askToJoinDiscussion}
        a11yTitle={intl.formatMessage(messages.askInstructor)}
        style={{ padding: '0' }}
        icon={
          <JoinDiscussionSVG
            baseColor={'blue-off'}
            hoverColor={'blue-active'}
            title={intl.formatMessage(messages.askInstructor)}
            width={'33'}
            height={'41.67'}
          />
        }
      />
    </React.Fragment>
  );
};

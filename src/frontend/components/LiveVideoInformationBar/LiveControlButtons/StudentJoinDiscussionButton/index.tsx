import { Box, Button, Layer, Text, TextInput, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { theme } from 'utils/theme/theme';

import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { JoinDiscussionSVG } from 'components/SVGIcons/JoinDiscussionSVG';
import { PUBLIC_JITSI_ROUTE } from 'components/PublicVideoLiveJitsi/route';
import { converse } from 'utils/window';

const messages = defineMessages({
  askInstructor: {
    defaultMessage: 'Send request to join the discussion',
    description: 'Ask the instructor to join the discussion',
    id: 'components.StudentJoinDiscussionButton.askInstructor',
  },
  waitingInstructor: {
    defaultMessage: "Waiting for Instructor's response",
    description: `Text that replace the JoinDiscussion button before the instructor response.`,
    id: 'components.StudentJoinDiscussionButton.waitingInstructor',
  },
  rejected: {
    defaultMessage:
      'Your request to join the discussion has not been accepted.',
    description: 'Text to tell participant his/her request is not accepted',
    id: 'components.StudentJoinDiscussionButton.rejected',
  },
  chooseUsername: {
    defaultMessage: 'Choose a username',
    description:
      'Title displayed in the layer to ask the user to choose a username in order to connect to the chat',
    id: 'components.StudentJoinDiscussionButton.chooseUsername',
  },
  UsernameAlreadyExists: {
    defaultMessage: 'Username already exists, please choose another one',
    description:
      'Error message shown when the connection to the chat failed if the username is already in use.',
    id: 'components.StudentJoinDiscussionButton.usernameAlreadyExists',
  },
  username: {
    defaultMessage: 'Username',
    description: 'label used by the input text to write the username to choose',
    id: 'components.StudentJoinDiscussionButton.username',
  },
  confirm: {
    defaultMessage: 'Confirm',
    description: 'Label used by the confirm button',
    id: 'components.StudentJoinDiscussionButton.confirm',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Label used by the cancel button',
    id: 'components.StudentJoinDiscussionButton.cancel',
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

  if (accepted) {
    return <Redirect to={PUBLIC_JITSI_ROUTE()} />;
  }

  if (rejected) {
    return <Text>{intl.formatMessage(messages.rejected)}</Text>;
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
          <Box gap="medium" pad="large">
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
      <Box align="center" direction="column">
        <Button
          a11yTitle={intl.formatMessage(messages.askInstructor)}
          icon={
            <JoinDiscussionSVG
              backgroundColor="none"
              baseColor={normalizeColor('blue-active', theme)}
              title={intl.formatMessage(messages.askInstructor)}
              width={'54'}
              height={'54'}
            />
          }
          margin={{ bottom: '6px' }}
          onClick={askToJoinDiscussion}
          style={{ padding: '0', textAlign: 'center' }}
        />
        <Paragraph color="blue-active" margin="none" size="12px">
          {intl.formatMessage(messages.askInstructor)}
        </Paragraph>
      </Box>
    </React.Fragment>
  );
};

import React, { useEffect, useState } from 'react';
import { Box, Button, Layer, Text, TextInput } from 'grommet';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { Button as StudentButton } from 'components/Button';
import { JoinDiscussionSVG } from 'components/SVGIcons/JoinDiscussionSVG';
import { converse } from 'utils/window';

const messages = defineMessages({
  askInstructor: {
    defaultMessage: 'Send request to join the discussion',
    description: 'Ask the instructor to join the discussion',
    id: 'components.StudentJoinDiscussionButton.askInstructor',
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
  const { usernameAlreadyExisting, reset, setAsked } = useParticipantWorkflow(
    (state) => ({
      usernameAlreadyExisting: state.usernameAlreadyExisting,
      setAsked: state.setAsked,
      reset: state.reset,
    }),
  );

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
  };

  useEffect(() => {
    if (usernameAlreadyExisting) {
      setShowUsernameForm(true);
    }
  }, [usernameAlreadyExisting]);

  return (
    <React.Fragment>
      {showUsernameForm && (
        <Layer
          position="center"
          onClickOutside={closeUserNameForm}
          onEsc={closeUserNameForm}
        >
          <Box gap="medium" pad="large">
            <FormattedMessage {...messages.chooseUsername} />
            {usernameAlreadyExisting && (
              <Text color="status-error">
                <FormattedMessage {...messages.UsernameAlreadyExists} />
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
                primary
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
      <StudentButton
        label={intl.formatMessage(messages.askInstructor)}
        Icon={JoinDiscussionSVG}
        onClick={askToJoinDiscussion}
        title={intl.formatMessage(messages.askInstructor)}
      />
    </React.Fragment>
  );
};

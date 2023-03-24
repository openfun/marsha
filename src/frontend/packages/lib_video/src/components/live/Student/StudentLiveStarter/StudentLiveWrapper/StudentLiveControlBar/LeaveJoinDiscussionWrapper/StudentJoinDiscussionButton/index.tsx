/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Button as StudentButton, JoinDiscussionSVG } from 'lib-components';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';
import { useSetDisplayName } from '@lib-video/hooks/useSetDisplayName';
import { converse } from '@lib-video/utils/window';

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
  const session = useLiveSession();
  const [askingToJoin, setAskingToJoin] = useState(false);
  const [isDisplayNameFormVisible, setDisplayNameFormVisible] =
    useSetDisplayName();
  const { setAsked } = useParticipantWorkflow((state) => ({
    usernameAlreadyExisting: state.usernameAlreadyExisting,
    setAsked: state.setAsked,
    reset: state.reset,
  }));

  const askToJoinDiscussion = () => {
    setAskingToJoin(true);
  };

  useEffect(() => {
    const join = async () => {
      if (!session.liveSession?.display_name) {
        //  prompt display name form when it is not set
        setDisplayNameFormVisible(true);
      } else {
        //  perform action to join the discussion
        await converse.askParticipantToJoin();
        //  save the request in the store
        setAsked();
      }
    };

    if (!askingToJoin) {
      //  do nothing if you don't want to join the discussion
      return;
    }
    join();
  }, [
    askingToJoin,
    session.liveSession?.display_name,
    setAsked,
    setDisplayNameFormVisible,
  ]);

  useEffect(() => {
    //  when display name form is closed without a display name (meaning it has been closed)
    if (!isDisplayNameFormVisible && !session.liveSession?.display_name) {
      //  reset the join discussion state
      setAskingToJoin(false);
    }
  }, [
    isDisplayNameFormVisible,
    setAskingToJoin,
    session.liveSession?.display_name,
  ]);

  return (
    <StudentButton
      label={intl.formatMessage(messages.askInstructor)}
      Icon={JoinDiscussionSVG}
      onClick={askToJoinDiscussion}
      title={intl.formatMessage(messages.askInstructor)}
    />
  );
};

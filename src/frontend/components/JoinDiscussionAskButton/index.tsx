import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { Box, Button, Layer, Text, TextInput } from 'grommet';

import { useParticipantWorkflow } from '../../data/stores/useParticipantWorkflow';
import { useUserWorkflow } from '../../data/stores/useUserWorkflow';
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
    defaultMessage: 'Waiting for Instructor response',
    description: `Text that replace the JoinDiscussion button before the instructor response.`,
    id: 'components.JoinDiscussionAskButton.waitingInstructor',
  },
});

export const JoinDiscussionAskButton = () => {
  const [showInput, setShowInput] = useState(false);
  const test = false
  const { asked, accepted, setAsked } = useParticipantWorkflow((state) => ({
    asked: state.asked,
    accepted: state.accepted,
    setAsked: state.setAsked,
  }));
  const { onRoom, nickname, setAsking, setNickname } = useUserWorkflow((state) => ({
    onRoom: state.onRoom,
    nickname: state.nickname,
    setAsking: state.setAsking,
    setNickname: state.setNickname,
  }));


  const onClick = () => {
    if (onRoom) {
      converse.askParticipantToMount();
      setAsked();
    } else {
      if (nickname != undefined) {
        converse.joinRoomWithNickname();
        setAsking(true);
        setAsked();
      } else {
        setShowInput(true);
      }
    }
  };

  if (accepted) {
    return <Redirect to={PUBLIC_JITSI_ROUTE()} />;
  }

  return asked ? (
    <FormattedMessage {...messages.waitingInstructor} />
  ) : (
    showInput ? 
    (<Layer
      position="center"
      onClickOutside={() => setShowInput(false)}
      onEsc={() => setShowInput(false)}
    >
      <Box pad="large" gap="medium">
        <Text>Choose a nickname</Text>
        <TextInput
          placeholder="nickname"
          value={nickname}
          onChange={event => setNickname(event.target.value)}
        />
        <Box align="center" direction="row" gap="medium">
          <Button
            label={"Confirm"}
            onClick={onClick}
            primary={true}
          />
          <Button
            label={"Cancel"}
            onClick={() => setShowInput(false)}
          />
        </Box>
      </Box>
    </Layer>
    ) : (
    <DashboardButton
      label={<FormattedMessage {...messages.askInstructor} />}
      primary={true}
      onClick={onClick}
    />)
  );
};

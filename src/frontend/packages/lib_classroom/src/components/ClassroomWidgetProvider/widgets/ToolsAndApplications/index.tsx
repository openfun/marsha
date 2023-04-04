import { Box } from 'grommet';
import { Classroom, FoldableItem, ToggleInput } from 'lib-components';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateClassroom } from '@lib-classroom/data/queries';
import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const messages = defineMessages({
  title: {
    defaultMessage: 'Tools and Applications',
    description: 'A title for the widget.',
    id: 'component.ToolsAndApplications.title',
  },
  info: {
    defaultMessage:
      'This widget can be used to configure the classroom. A checked toggle means the feature is enabled.',
    description: 'Helptext for the widget.',
    id: 'component.ToolsAndApplications.info',
  },
  enableChat: {
    defaultMessage: 'Enable chat',
    description: 'Label for the switch that enables or disables the chat',
    id: 'component.ToolsAndApplications.enableChat',
  },
  enableSharedNotes: {
    defaultMessage: 'Enable shared notes',
    description: 'Label for the switch that enables or disables shared notes',
    id: 'component.ToolsAndApplications.enableSharedNotes',
  },
  enableWaitingRoom: {
    defaultMessage: 'Enable waiting room',
    description: 'Label for the switch that enables or disables waiting room',
    id: 'component.ToolsAndApplications.enableWaitingRoom',
  },
  enablePresentationSupports: {
    defaultMessage: 'Enable presentation supports sharing',
    description:
      'Label for the switch that enables or disables presentation support sharing',
    id: 'component.ToolsAndApplications.enablePresentationSupports',
  },
  enableRecordings: {
    defaultMessage: 'Enable recordings',
    description: 'Label for the switch that enables or disables recordings',
    id: 'component.ToolsAndApplications.enableRecordings',
  },
  updateClassroomSuccess: {
    defaultMessage: 'Classroom updated.',
    description: 'Message when classroom update is successful.',
    id: 'component.ToolsAndApplications.updateClassroomSuccess',
  },
  updateClassroomFail: {
    defaultMessage: 'Classroom not updated!',
    description: 'Message when classroom update failed.',
    id: 'component.ToolsAndApplications.updateClassroomFail',
  },
});

interface ToolsAndApplicationCheckboxProps {
  checked: boolean;
  message: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ToolsAndApplicationCheckbox = ({
  checked,
  message,
  onChange,
}: ToolsAndApplicationCheckboxProps) => {
  return (
    <Box
      align="left"
      background="blue-message"
      fill
      round="xsmall"
      margin={{ bottom: 'small' }}
    >
      <ToggleInput checked={checked} label={message} onChange={onChange} />
    </Box>
  );
};

export const ToolsAndApplications = () => {
  const classroom = useCurrentClassroom();
  const intl = useIntl();
  const updateClassroomMutation = useUpdateClassroom(classroom.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateClassroomSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updateClassroomFail));
      setUpdatedClassroomState(classroom);
    },
  });
  const [updatedClassroomState, setUpdatedClassroomState] = useState<
    Partial<Classroom>
  >({});

  const handleChange = (updatedClassroomAttribute: Partial<Classroom>) => {
    const updatedClassroom = {
      ...updatedClassroomState,
      ...updatedClassroomAttribute,
    };
    setUpdatedClassroomState(updatedClassroom);
    if (JSON.stringify(updatedClassroom) !== '{}') {
      updateClassroomMutation.mutate(updatedClassroom);
    }
  };

  useEffect(() => {
    setUpdatedClassroomState({});
  }, [classroom]);

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <ToolsAndApplicationCheckbox
        checked={classroom.enable_chat}
        message={intl.formatMessage(messages.enableChat)}
        onChange={() => handleChange({ enable_chat: !classroom.enable_chat })}
      />
      <ToolsAndApplicationCheckbox
        checked={classroom.enable_shared_notes}
        message={intl.formatMessage(messages.enableSharedNotes)}
        onChange={() =>
          handleChange({
            enable_shared_notes: !classroom.enable_shared_notes,
          })
        }
      />
      <ToolsAndApplicationCheckbox
        checked={classroom.enable_waiting_room}
        message={intl.formatMessage(messages.enableWaitingRoom)}
        onChange={() =>
          handleChange({
            enable_waiting_room: !classroom.enable_waiting_room,
          })
        }
      />
      {/*
      (FIXME) This switch doesn't currently work as expected. It might come from
      the BBB classroom creation config, but the document sharing option is always
      enabled regardless of the switch position and the object value

      <ToolsAndApplicationCheckbox
        checked={classroom.enable_presentation_supports}
        message={intl.formatMessage(messages.enablePresentationSupports)}
        onChange={() =>
          handleChange({
            enable_presentation_supports:
              !classroom.enable_presentation_supports,
          })
        }
      /> 
      */}
      <ToolsAndApplicationCheckbox
        checked={classroom.enable_recordings}
        message={intl.formatMessage(messages.enableRecordings)}
        onChange={() =>
          handleChange({ enable_recordings: !classroom.enable_recordings })
        }
      />
    </FoldableItem>
  );
};

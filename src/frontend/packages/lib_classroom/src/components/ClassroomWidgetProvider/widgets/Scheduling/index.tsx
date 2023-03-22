import { Form } from 'grommet';
import { Maybe } from 'lib-common';
import {
  Classroom,
  debounce,
  FoldableItem,
  SchedulingFields,
} from 'lib-components';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateClassroom } from 'data/queries';
import { useCurrentClassroom } from 'hooks/useCurrentClassroom';

const messages = defineMessages({
  title: {
    defaultMessage: 'Scheduling',
    description: 'A title for the widget.',
    id: 'component.ClassroomScheduling.title',
  },
  info: {
    defaultMessage: 'This widget can be used to schedule a classroom.',
    description: 'Helptext for the widget.',
    id: 'component.ClassroomScheduling.info',
  },
  scheduleClassroomLabel: {
    defaultMessage: 'Update classroom scheduling',
    description: 'Label for confirm button in classroom scheduling form.',
    id: 'component.ClassroomScheduling.scheduleClassroomLabel',
  },
  updateClassroomSuccess: {
    defaultMessage: 'Classroom updated.',
    description: 'Message when classroom update is successful.',
    id: 'component.ClassroomScheduling.updateClassroomSuccess',
  },
  updateClassroomFail: {
    defaultMessage: 'Classroom not updated!',
    description: 'Message when classroom update failed.',
    id: 'component.ClassroomScheduling.updateClassroomFail',
  },
});

export const Scheduling = () => {
  const classroom = useCurrentClassroom();
  const intl = useIntl();
  const [updatedClassroomState, setUpdatedClassroomState] = useState<
    Partial<Classroom>
  >({});
  const updateClassroomMutation = useUpdateClassroom(classroom.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateClassroomSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updateClassroomFail));
      setUpdatedClassroomState(classroom);
    },
  });

  const timeoutId = useRef<Maybe<number>>();

  const debouncedUpdateClassroom = React.useRef(
    debounce((updatedClassroom: Partial<Classroom>) => {
      if (JSON.stringify(updatedClassroom) !== '{}') {
        updateClassroomMutation.mutate(updatedClassroom);
      }
    }),
  ).current;

  const handleChange = (updatedClassroomAttribute: Partial<Classroom>) => {
    const updatedClassroom = {
      ...updatedClassroomState,
      ...updatedClassroomAttribute,
    };
    setUpdatedClassroomState(updatedClassroom);
    window.clearTimeout(timeoutId.current);
    debouncedUpdateClassroom(updatedClassroom);
  };

  const handleBlur = () => {
    if (JSON.stringify(updatedClassroomState) !== '{}') {
      window.clearTimeout(timeoutId.current);
      updateClassroomMutation.mutate(updatedClassroomState);
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
      <Form
        value={{ ...classroom, ...updatedClassroomState }}
        onBlur={handleBlur}
      >
        <SchedulingFields
          vertical
          margin="none"
          startingAt={
            updatedClassroomState.starting_at || classroom.starting_at
          }
          estimatedDuration={
            updatedClassroomState.estimated_duration ||
            classroom.estimated_duration
          }
          onStartingAtChange={(startingAt) => {
            handleChange({
              starting_at: startingAt,
            });
          }}
          onEstimatedDurationChange={(estimatedDuration) => {
            handleChange({
              estimated_duration: estimatedDuration,
            });
          }}
        />
      </Form>
    </FoldableItem>
  );
};

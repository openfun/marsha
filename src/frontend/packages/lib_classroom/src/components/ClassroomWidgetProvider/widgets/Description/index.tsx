import { Field, TextArea } from '@openfun/cunningham-react';
import { Maybe } from 'lib-common';
import { Classroom, FoldableItem, debounce } from 'lib-components';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateClassroom } from '@lib-classroom/data/queries';
import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const DEBOUNCE_TIME_MS = 1500;

const messages = defineMessages({
  title: {
    defaultMessage: 'Description',
    description: 'A title for the widget.',
    id: 'component.ClassroomDescription.title',
  },
  descriptionLabel: {
    defaultMessage: 'Description',
    description: 'Label for description in classroom creation form.',
    id: 'component.ClassroomDescription.descriptionLabel',
  },
  info: {
    defaultMessage:
      'This widget can be used to set a description to the classroom.',
    description: 'Helptext for the widget.',
    id: 'component.ClassroomDescription.info',
  },
  welcomeTextLabel: {
    defaultMessage: 'Welcome text',
    description: 'Label for welcome text in classroom creation form.',
    id: 'component.ClassroomDescription.welcomeTextLabel',
  },
  updateClassroomSuccess: {
    defaultMessage: 'Classroom updated.',
    description: 'Message when classroom update is successful.',
    id: 'component.ClassroomDescription.updateClassroomSuccess',
  },
  updateClassroomFail: {
    defaultMessage: 'Classroom not updated!',
    description: 'Message when classroom update failed.',
    id: 'component.ClassroomDescription.updateClassroomFail',
  },
});

export const Description = () => {
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
  const [updatedClassroomState, setUpdatedClassroomState] =
    useState<Partial<Classroom>>(classroom);

  const timeoutId = useRef<Maybe<number>>();

  const debouncedUpdateClassroom = React.useRef(
    debounce((updatedClassroom: Partial<Classroom>) => {
      if (JSON.stringify(updatedClassroom) !== '{}') {
        updateClassroomMutation.mutate(updatedClassroom);
      }
    }, DEBOUNCE_TIME_MS),
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

  useEffect(() => {
    setUpdatedClassroomState(classroom);
  }, [classroom]);

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <TextArea
        label={intl.formatMessage(messages.descriptionLabel)}
        value={{ ...classroom, ...updatedClassroomState }.description || ''}
        onChange={(e) => {
          handleChange({ description: e.target.value });
        }}
        style={{
          minHeight: '150px',
        }}
        onInput={(e) => {
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
        }}
      />

      <Field className="mt-s" fullWidth>
        <TextArea
          label={intl.formatMessage(messages.welcomeTextLabel)}
          value={{ ...classroom, ...updatedClassroomState }.welcome_text || ''}
          onChange={(e) => {
            handleChange({ welcome_text: e.target.value });
          }}
          style={{
            minHeight: '150px',
          }}
          onInput={(e) => {
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
          }}
        />
      </Field>
    </FoldableItem>
  );
};

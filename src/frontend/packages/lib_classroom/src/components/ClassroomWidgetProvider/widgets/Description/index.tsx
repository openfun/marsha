import { Form, FormField, TextArea } from 'grommet';
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
  const [updatedClassroomState, setUpdatedClassroomState] = useState<
    Partial<Classroom>
  >({});

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
        <FormField
          label={intl.formatMessage(messages.descriptionLabel)}
          htmlFor="description"
          margin={{ bottom: 'medium' }}
        >
          <TextArea
            name="description"
            id="description"
            value={{ ...classroom, ...updatedClassroomState }.description || ''}
            onChange={(e) => {
              handleChange({ description: e.target.value });
            }}
            resize="vertical"
            style={{
              minHeight: '150px',
            }}
            onInput={(e) => {
              e.currentTarget.style.height = 'auto';
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
          />
        </FormField>
        <FormField
          label={intl.formatMessage(messages.welcomeTextLabel)}
          htmlFor="welcome_text"
          margin={{ bottom: 'medium' }}
        >
          <TextArea
            name="welcome_text"
            id="welcome_text"
            value={
              { ...classroom, ...updatedClassroomState }.welcome_text || ''
            }
            onChange={(e) => {
              handleChange({ welcome_text: e.target.value });
            }}
            resize="vertical"
            style={{
              minHeight: '150px',
            }}
            onInput={(e) => {
              e.currentTarget.style.height = 'auto';
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
          />
        </FormField>
      </Form>
    </FoldableItem>
  );
};

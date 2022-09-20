import { Button, Form, FormField, Text, TextArea, TextInput } from 'grommet';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { SchedulingFields } from 'components/SchedulingFields';
import { UploadManager } from 'components/UploadManager';
import { Maybe } from 'utils/types';

import { DashboardClassroomLayout } from 'apps/bbb/components/DashboardClassroomLayout';
import { UploadDocuments } from 'apps/bbb/components/UploadDocuments';
import {
  useCreateClassroomAction,
  useUpdateClassroom,
} from 'apps/bbb/data/queries';
import { Classroom } from 'apps/bbb/types/models';

const messages = defineMessages({
  createClassroomFail: {
    defaultMessage: 'Classroom not created!',
    description: 'Message when classroom creation failed.',
    id: 'component.DashboardClassroomForm.createClassroomFail',
  },
  titleLabel: {
    defaultMessage: 'Title',
    description: 'Label for title in classroom creation form.',
    id: 'component.DashboardClassroomForm.titleLabel',
  },
  descriptionLabel: {
    defaultMessage: 'Description',
    description: 'Label for description in classroom creation form.',
    id: 'component.DashboardClassroomForm.descriptionLabel',
  },
  welcomeTextLabel: {
    defaultMessage: 'Welcome text',
    description: 'Label for welcome text in classroom creation form.',
    id: 'component.DashboardClassroomForm.welcomeTextLabel',
  },
  startClassroomLabel: {
    defaultMessage: 'Launch the classroom now in BBB',
    description: 'Label for the button starting the classroom creation in BBB.',
    id: 'component.DashboardClassroomForm.startClassroomLabel',
  },
  scheduleClassroomLabel: {
    defaultMessage: 'Update classroom scheduling',
    description: 'Label for confirm button in classroom scheduling form.',
    id: 'component.DashboardClassroomForm.scheduleClassroomLabel',
  },
  updateClassroomSuccess: {
    defaultMessage: 'Classroom updated.',
    description: 'Message when classroom update is successful.',
    id: 'component.DashboardClassroomForm.updateClassroomSuccess',
  },
  updateClassroomFail: {
    defaultMessage: 'Classroom not updated!',
    description: 'Message when classroom update failed.',
    id: 'component.DashboardClassroomForm.updateClassroomFail',
  },
  requiredTitle: {
    defaultMessage: 'Title is required to launch the classroom.',
    description: 'Message when classroom title is missing.',
    id: 'component.DashboardClassroomForm.requiredTitle',
  },
});

interface DashboardClassroomFormProps {
  classroom: Classroom;
}

const DashboardClassroomForm = ({ classroom }: DashboardClassroomFormProps) => {
  const intl = useIntl();
  const createClassroomMutation = useCreateClassroomAction(classroom.id, {
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.createClassroomFail));
    },
  });
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

  const debounce = (
    fn: (updatedClassroom: Partial<Classroom>) => void,
    ms = 500,
  ) => {
    return (updatedClassroom: Partial<Classroom>) => {
      window.clearTimeout(timeoutId.current);
      timeoutId.current = window.setTimeout(() => fn(updatedClassroom), ms);
    };
  };

  const debouncedUpdateClassroom = React.useRef(
    debounce(async (updatedClassroom: Partial<Classroom>) => {
      if (JSON.stringify(updatedClassroom) !== '{}') {
        updateClassroomMutation.mutate(updatedClassroom);
      }
    }),
  ).current;

  const handleChange = async (
    updatedClassroomAttribute: Partial<Classroom>,
  ) => {
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

  const titleError = !{ ...classroom, ...updatedClassroomState }.title && (
    <Text size="small" color="status-error">
      <FormattedMessage {...messages.requiredTitle} />
    </Text>
  );

  const left = (
    <UploadManager>
      <Form
        value={{ ...classroom, ...updatedClassroomState }}
        onBlur={handleBlur}
      >
        <FormField
          label={intl.formatMessage(messages.titleLabel)}
          htmlFor="title"
          required={true}
          error={titleError}
          background={titleError ? 'status-error-off' : 'white'}
          margin={{ bottom: 'medium' }}
        >
          <TextInput
            name="title"
            id="title"
            value={{ ...classroom, ...updatedClassroomState }.title || ''}
            onChange={(e) => {
              handleChange({ title: e.target.value });
            }}
          />
        </FormField>
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
          />
        </FormField>
        <SchedulingFields
          margin="none"
          startingAt={
            updatedClassroomState.starting_at || classroom.starting_at
          }
          estimatedDuration={
            updatedClassroomState.estimated_duration ||
            classroom.estimated_duration
          }
          onStartingAtChange={(startingAt) => {
            return handleChange({
              starting_at: startingAt,
            });
          }}
          onEstimatedDurationChange={(estimatedDuration) => {
            return handleChange({
              estimated_duration: estimatedDuration,
            });
          }}
        />
      </Form>
      <UploadDocuments />
    </UploadManager>
  );
  const right = (
    <Button
      type="submit"
      label={intl.formatMessage(messages.startClassroomLabel)}
      disabled={!classroom.title}
      primary
      size="large"
      fill="horizontal"
      onClick={() => {
        createClassroomMutation.mutate(classroom);
      }}
    />
  );

  return <DashboardClassroomLayout left={left} right={right} />;
};

export default DashboardClassroomForm;

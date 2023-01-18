import { Box, Form, FormField, Text, TextArea, TextInput } from 'grommet';
import { Maybe } from 'lib-common';
import {
  SchedulingFields,
  UploadManager,
  Classroom,
  ClassroomRecording,
  ItemList,
} from 'lib-components';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import DashboardCopyClipboard from 'components/DashboardCopyClipboard';
import { UploadDocuments } from 'components/UploadDocuments';
import { useUpdateClassroom } from 'data/queries';

const DEBOUNCE_TIME_MS = 1500;

const messages = defineMessages({
  titleLabel: {
    defaultMessage: 'Title',
    description: 'Label for title in classroom creation form.',
    id: 'component.ClassroomForm.titleLabel',
  },
  descriptionLabel: {
    defaultMessage: 'Description',
    description: 'Label for description in classroom creation form.',
    id: 'component.ClassroomForm.descriptionLabel',
  },
  welcomeTextLabel: {
    defaultMessage: 'Welcome text',
    description: 'Label for welcome text in classroom creation form.',
    id: 'component.ClassroomForm.welcomeTextLabel',
  },
  scheduleClassroomLabel: {
    defaultMessage: 'Update classroom scheduling',
    description: 'Label for confirm button in classroom scheduling form.',
    id: 'component.ClassroomForm.scheduleClassroomLabel',
  },
  updateClassroomSuccess: {
    defaultMessage: 'Classroom updated.',
    description: 'Message when classroom update is successful.',
    id: 'component.ClassroomForm.updateClassroomSuccess',
  },
  updateClassroomFail: {
    defaultMessage: 'Classroom not updated!',
    description: 'Message when classroom update failed.',
    id: 'component.ClassroomForm.updateClassroomFail',
  },
  requiredTitle: {
    defaultMessage: 'Title is required to launch the classroom.',
    description: 'Message when classroom title is missing.',
    id: 'component.ClassroomForm.requiredTitle',
  },
  recordingsLabel: {
    defaultMessage: 'Recordings',
    description: 'Label for recordings in classroom creation form.',
    id: 'component.ClassroomForm.recordingsLabel',
  },
  noRecordingsAvailable: {
    defaultMessage: 'No recordings available',
    description: 'Message when no recordings are available.',
    id: 'component.ClassroomForm.noRecordingsAvailable',
  },
  downloadRecordingLabel: {
    defaultMessage: 'Download recording',
    description: 'Label for download recording button.',
    id: 'component.ClassroomForm.downloadRecordingLabel',
  },
});

interface ClassroomFormProps {
  classroom: Classroom;
}

export const ClassroomForm = ({ classroom }: ClassroomFormProps) => {
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

  const debounce = (
    fn: (updatedClassroom: Partial<Classroom>) => void,
    ms = DEBOUNCE_TIME_MS,
  ) => {
    return (updatedClassroom: Partial<Classroom>) => {
      window.clearTimeout(timeoutId.current);
      timeoutId.current = window.setTimeout(() => fn(updatedClassroom), ms);
    };
  };

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

  const titleError = !{ ...classroom, ...updatedClassroomState }.title && (
    <Text size="small" color="status-error">
      <FormattedMessage {...messages.requiredTitle} />
    </Text>
  );

  return (
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
            resize="vertical"
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

      <Box margin={{ top: 'medium' }}>
        <DashboardCopyClipboard
          inviteToken={classroom.invite_token}
          classroomId={classroom.id}
        />
      </Box>

      <UploadDocuments classroomId={classroom.id} />

      <Box direction="column" gap="small" margin={{ top: 'medium' }}>
        <Box direction="row" gap="small">
          <Text size="medium">
            {intl.formatMessage(messages.recordingsLabel)}
          </Text>
        </Box>
        <ItemList
          itemList={classroom.recordings}
          noItemsMessage={intl.formatMessage(messages.noRecordingsAvailable)}
        >
          {(recording: ClassroomRecording) => (
            <Box
              key={recording.id}
              direction="row"
              align="center"
              fill="horizontal"
              height="60px"
              gap="medium"
              pad="small"
            >
              <a
                title={intl.formatMessage(messages.downloadRecordingLabel)}
                href={recording.video_file_url}
                target="_blank"
                rel="noreferrer noopener"
              >
                {intl.formatDate(recording.started_at, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                }) +
                  ' - ' +
                  intl.formatDate(recording.started_at, {
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
              </a>
            </Box>
          )}
        </ItemList>
      </Box>
    </UploadManager>
  );
};

import {
  Box,
  Button,
  Form,
  FormField,
  TextArea,
  TextInput,
} from 'grommet';
import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { SchedulingFields } from 'components/SchedulingFields';
import { Maybe } from 'utils/types';

import { DashboardMeetingLayout } from 'apps/bbb/DashboardMeetingLayout';
import { useCreateMeeting, useUpdateMeeting } from 'apps/bbb/data/queries';
import { Meeting } from 'apps/bbb/types/models';

const messages = defineMessages({
  createMeetingFail: {
    defaultMessage: 'Meeting not created!',
    description: 'Message when meeting creation failed.',
    id: 'component.DashboardMeetingForm.createMeetingFail',
  },
  titleLabel: {
    defaultMessage: 'Title',
    description: 'Label for title in meeting creation form.',
    id: 'component.DashboardMeetingForm.titleLabel',
  },
  descriptionLabel: {
    defaultMessage: 'Description',
    description: 'Label for description in meeting creation form.',
    id: 'component.DashboardMeetingForm.descriptionLabel',
  },
  welcomeTextLabel: {
    defaultMessage: 'Welcome text',
    description: 'Label for welcome text in meeting creation form.',
    id: 'component.DashboardMeetingForm.welcomeTextLabel',
  },
  createMeetingLabel: {
    defaultMessage: 'Create meeting in BBB',
    description: 'Label for confirm button in meeting creation form.',
    id: 'component.DashboardMeetingForm.createMeetingLabel',
  },
  scheduleMeetingLabel: {
    defaultMessage: 'Update meeting scheduling',
    description: 'Label for confirm button in meeting scheduling form.',
    id: 'component.DashboardMeetingForm.scheduleMeetingLabel',
  },
  updateMeetingSuccess: {
    defaultMessage: 'Meeting updated.',
    description: 'Message when meeting update is successful.',
    id: 'component.DashboardMeetingForm.updateMeetingSuccess',
  },
  updateMeetingFail: {
    defaultMessage: 'Meeting not updated!',
    description: 'Message when meeting update failed.',
    id: 'component.DashboardMeetingForm.updateMeetingFail',
  },
});

interface DashboardMeetingFormProps {
  meeting: Meeting;
}

const DashboardMeetingForm = ({ meeting }: DashboardMeetingFormProps) => {
  const intl = useIntl();
  const createMeetingMutation = useCreateMeeting(meeting.id, {
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.createMeetingFail));
    },
  });
  const updateMeetingMutation = useUpdateMeeting(meeting.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateMeetingSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updateMeetingFail));
      setUpdatedMeetingState(meeting);
    },
  });
  const [updatedMeetingState, setUpdatedMeetingState] = useState<
    Partial<Meeting>
  >({});
  const timeoutId = useRef<Maybe<number>>();

  const debounce = (
    fn: (updatedMeeting: Partial<Meeting>) => void,
    ms = 500,
  ) => {
    return (updatedMeeting: Partial<Meeting>) => {
      window.clearTimeout(timeoutId.current);
      timeoutId.current = window.setTimeout(() => fn(updatedMeeting), ms);
    };
  };

  const debouncedUpdateMeeting = React.useRef(
    debounce(async (updatedMeeting: Partial<Meeting>) => {
      updateMeetingMutation.mutate(updatedMeeting);
    }),
  ).current;

  async function handleChange(updatedMeeting: Partial<Meeting>) {
    setUpdatedMeetingState({ ...updatedMeetingState, ...updatedMeeting });
    debouncedUpdateMeeting({ ...updatedMeetingState, ...updatedMeeting });
  }

  return (
    <Form
      value={updatedMeetingState}
      onChange={handleChange}
      onSubmit={(event) => {
        createMeetingMutation.mutate(event.value);
      }}
    >
      <FormField
        label={intl.formatMessage(messages.titleLabel)}
        htmlFor="title"
      >
        <TextInput
          name="title"
          id="title"
          value={{ ...meeting, ...updatedMeetingState }.title || ''}
          onChange={(e) => {
            handleChange({ title: e.target.value });
          }}
        />
      </FormField>
      <FormField
        label={intl.formatMessage(messages.descriptionLabel)}
        htmlFor="description"
      >
        <TextArea
          name="description"
          id="description"
          value={{ ...meeting, ...updatedMeetingState }.description || ''}
          onChange={(e) => {
            handleChange({ description: e.target.value });
          }}
        />
      </FormField>
      <FormField
        label={intl.formatMessage(messages.welcomeTextLabel)}
        htmlFor="welcome_text"
      >
        <TextArea
          name="welcome_text"
          id="welcome_text"
          value={{ ...meeting, ...updatedMeetingState }.welcome_text || ''}
          onChange={(e) => {
            handleChange({ welcome_text: e.target.value });
          }}
        />
      </FormField>
      <SchedulingFields
        startingAt={updatedMeetingState.starting_at || meeting.starting_at}
        estimatedDuration={updatedMeetingState.estimated_duration || meeting.estimated_duration}
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
      <Box align="center">
        <Button
          fill="horizontal"
          type="submit"
          label={intl.formatMessage(messages.createMeetingLabel)}
          primary
        />
      </Box>
    </Form>
  );
};

export default DashboardMeetingForm;

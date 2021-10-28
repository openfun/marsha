import { Box, Button, Form, FormField, TextInput } from 'grommet';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useCreateMeeting } from 'apps/bbb/data/queries';
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
  const [updatedMeeting, setUpdatedMeeting] = useState(meeting);

  return (
    <Form
      value={updatedMeeting}
      onChange={setUpdatedMeeting}
      onSubmit={() => {
        createMeetingMutation.mutate(updatedMeeting);
      }}
    >
      <Box direction="row" justify="between" margin="medium" gap="medium">
        <FormField
          label={intl.formatMessage(messages.titleLabel)}
          htmlFor="title"
        >
          <TextInput name="title" id="title" />
        </FormField>
        <FormField
          label={intl.formatMessage(messages.welcomeTextLabel)}
          htmlFor="welcome_text"
        >
          <TextInput name="welcome_text" id="welcome_text" />
        </FormField>
      </Box>
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

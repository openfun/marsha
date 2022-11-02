import { Button } from 'grommet';
import React from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardClassroomLayout } from 'lib-classroom';
import { useCreateClassroomAction, ClassroomForm } from 'lib-classroom';
import { Classroom } from 'lib-components/src/types/apps/classroom/models';

const messages = defineMessages({
  createClassroomFail: {
    defaultMessage: 'Classroom not created!',
    description: 'Message when classroom creation failed.',
    id: 'component.DashboardClassroomForm.createClassroomFail',
  },
  startClassroomLabel: {
    defaultMessage: 'Launch the classroom now in BBB',
    description: 'Label for the button starting the classroom creation in BBB.',
    id: 'component.DashboardClassroomForm.startClassroomLabel',
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

  return (
    <DashboardClassroomLayout
      left={<ClassroomForm classroom={classroom} />}
      right={right}
    />
  );
};

export default DashboardClassroomForm;

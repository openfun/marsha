import {
  Classroom,
  RetentionDate as CommonRetentionDate,
  debounce,
} from 'lib-components';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateClassroom } from '@lib-classroom/data/queries';
import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const messages = defineMessages({
  ressource: {
    defaultMessage: 'classroom',
    description:
      'Type of ressource displayed in the info retention date widget.',
    id: 'component.ClassroomRetentionDate.ressource',
  },
  updateClassroomSuccess: {
    defaultMessage: 'Classroom updated.',
    description: 'Message displayed when classroom is successfully updated.',
    id: 'component.ClassroomRetentionDate.updateVideoSuccess',
  },
  updateClassroomFail: {
    defaultMessage: 'Classroom update has failed!',
    description: 'Message displayed when classroom update has failed.',
    id: 'component.ClassroomRetentionDate.updateVideoFail',
  },
});

export const RetentionDate = () => {
  const intl = useIntl();
  const classroom = useCurrentClassroom();
  const updateClassroomMutation = useUpdateClassroom(classroom.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateClassroomSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updateClassroomFail));
    },
  });
  const debouncedUpdatedClassroom = debounce<Classroom>(
    (updatedClassroomProperty: Partial<Classroom>) => {
      updateClassroomMutation.mutate(updatedClassroomProperty);
    },
  );

  return (
    <CommonRetentionDate
      retentionDate={classroom.retention_date}
      ressource={intl.formatMessage(messages.ressource)}
      onChange={function (newRetentionDate: string | null): void {
        debouncedUpdatedClassroom({
          retention_date: newRetentionDate,
        });
      }}
    />
  );
};

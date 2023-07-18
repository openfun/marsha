import { Box, Button, DateInput } from 'grommet';
import { Nullable } from 'lib-common';
import { Classroom, FoldableItem, debounce } from 'lib-components';
import { DateTime } from 'luxon';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useUpdateClassroom } from '@lib-classroom/data/queries';
import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to change the retention date of the classroom. Once this date is reached, the classroom will be deleted.',
    description: 'Info of the widget used to change classroom retention date.',
    id: 'components.ClassroomRetentionDate.info',
  },
  title: {
    defaultMessage: 'Retention date',
    description: 'Title of the widget used to change classroom retention date.',
    id: 'components.ClassroomRetentionDate.title',
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
  deleteClassroomRetentionDateButton: {
    defaultMessage: 'Delete retention date',
    description: 'Button used to delete classroom retention date.',
    id: 'component.ClassroomRetentionDate.deleteClassroomRetentionDateButton',
  },
});

const StyledAnchorButton = styled(Button)`
  height: 50px;
  font-family: 'Roboto-Medium';
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const RetentionDate = () => {
  const intl = useIntl();
  const classroom = useCurrentClassroom();
  const [selectedRetentionDate, setSelectedRetentionDate] = useState<
    Nullable<string>
  >(classroom.retention_date);

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

  function onChange(new_retention_date: string | string[]) {
    let new_retention_date_formatted = null;
    if (new_retention_date && typeof new_retention_date === 'string') {
      const utcDateTime = DateTime.fromISO(new_retention_date, { zone: 'utc' });
      const localDateTime = utcDateTime.toLocal();
      new_retention_date_formatted = localDateTime.toFormat('yyyy-MM-dd');
    }
    debouncedUpdatedClassroom({ retention_date: new_retention_date_formatted });
    setSelectedRetentionDate(new_retention_date_formatted);
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small" style={{ marginTop: '0.75rem' }}>
        <DateInput
          format={intl.locale === 'fr' ? 'dd/mm/yyyy' : 'yyyy/mm/dd'}
          value={selectedRetentionDate || ''}
          onChange={({ value }) => onChange(value)}
        />
        <StyledAnchorButton
          disabled={!selectedRetentionDate}
          a11yTitle={intl.formatMessage(
            messages.deleteClassroomRetentionDateButton,
          )}
          fill="horizontal"
          label={intl.formatMessage(
            messages.deleteClassroomRetentionDateButton,
          )}
          primary
          title={intl.formatMessage(
            messages.deleteClassroomRetentionDateButton,
          )}
          onClick={() => {
            onChange('');
          }}
        />
      </Box>
    </FoldableItem>
  );
};

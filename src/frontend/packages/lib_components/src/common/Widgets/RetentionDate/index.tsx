import { Button, DatePicker } from '@openfun/cunningham-react';
import { Nullable } from 'lib-common';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Box, FoldableItem } from '@lib-components/common';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to change the retention date of the {ressource}. Once this date is reached, the {ressource} will be deleted.',
    description: 'Info of the widget used to change retention date.',
    id: 'common.Widgets.RetentionDate.info',
  },
  title: {
    defaultMessage: 'Retention date',
    description: 'Title of the widget used to change retention date.',
    id: 'common.Widgets.RetentionDate.title',
  },
  deleteRetentionDateButton: {
    defaultMessage: 'Delete retention date',
    description: 'Button used to delete retention date.',
    id: 'common.Widgets.RetentionDate.deleteRetentionDateButton',
  },
});

interface RetentionDateProps {
  ressource: string;
  retentionDate: Nullable<string>;
  onChange: (newRetentionDate: string | null) => void;
}

export const RetentionDate = ({
  retentionDate,
  ressource,
  onChange,
}: RetentionDateProps) => {
  const intl = useIntl();
  const [selectedRetentionDate, setSelectedRetentionDate] = useState<
    Nullable<string>
  >(retentionDate ? new Date(retentionDate).toISOString() : null);

  function onLocalChange(newRetentionDate: string | null) {
    setSelectedRetentionDate(newRetentionDate || null);

    if (
      newRetentionDate &&
      new Date(newRetentionDate).getTime() <
        new Date(DateTime.local().toISODate() || '').getTime()
    ) {
      return;
    }

    // Format date to be compatible with the API
    onChange(
      newRetentionDate
        ? DateTime.fromISO(newRetentionDate).toFormat('yyyy-MM-dd')
        : null,
    );
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info, {
        ressource,
      })}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box gap="small" data-testid="retention-date-picker">
        <DatePicker
          fullWidth
          label={intl.formatMessage(messages.title)}
          locale={intl.locale}
          minValue={
            DateTime.local()
              .plus({ days: 1 })
              .set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
              })
              .toISO() as string
          }
          onChange={onLocalChange}
          value={selectedRetentionDate}
        />
        <Button
          fullWidth
          disabled={!selectedRetentionDate}
          aria-label={intl.formatMessage(messages.deleteRetentionDateButton)}
          title={intl.formatMessage(messages.deleteRetentionDateButton)}
          onClick={() => {
            onLocalChange(null);
          }}
        >
          {intl.formatMessage(messages.deleteRetentionDateButton)}
        </Button>
      </Box>
    </FoldableItem>
  );
};

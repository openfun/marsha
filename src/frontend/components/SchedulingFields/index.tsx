import { Box, DateInput, FormField, TextInput } from 'grommet';
import { MarginType } from 'grommet/utils';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Nullable } from 'utils/types';

const messages = defineMessages({
  startingAtDateTextLabel: {
    defaultMessage: 'Starting date',
    description:
      'Label of the input field to add/update the start date of the scheduled event',
    id: 'component.SchedulingFields.startingAtDateTextLabel',
  },
  startingAtTimeTextLabel: {
    defaultMessage: 'Starting time',
    description:
      'Label of the input field to add/update the start time of the scheduled event',
    id: 'component.SchedulingFields.startingAtTextLabel',
  },
  estimatedDurationTextLabel: {
    defaultMessage: 'Estimated duration',
    description:
      'Label of the input field to add/update the estimated duration of the scheduled event',
    id: 'component.SchedulingFields.estimatedDurationTextLabel',
  },
});

// build a list of times from 00h00 to 23h30
const currentTimeForSuggestions = Duration.fromObject({ hours: 0 });
const allTimesSuggestions = Array.from({ length: 48 }, (_v, k) => k * 30).map(
  (minutes) => currentTimeForSuggestions.plus({ minutes }).toFormat('hh:mm'),
);

const displayedDuration = (duration: Duration) => {
  return duration.toFormat('h:mm');
};

const returnedDuration = (durationString: string) => {
  if (durationString.length === 4) durationString = '0' + durationString;
  return durationString
    ? Duration.fromISOTime(durationString).toFormat('hh:mm:ss')
    : null;
};

// build a list of durations from 15 minutes to 12 hours
const currentDurationForSuggestions = Duration.fromObject({ minutes: 15 });
const allDurationSuggestions = Array.from(
  { length: 48 },
  (_v, k) => k * 15,
).map((minutes) =>
  displayedDuration(currentDurationForSuggestions.plus({ minutes })),
);

interface SchedulingFieldsProps {
  startingAt: Nullable<string>;
  estimatedDuration: Nullable<string>;
  onStartingAtChange?: (date: string | null) => void;
  onEstimatedDurationChange?: (duration: string | null) => void;
  margin?: MarginType;
}

export const SchedulingFields = ({
  startingAt,
  estimatedDuration,
  onStartingAtChange = () => {},
  onEstimatedDurationChange,
  margin,
}: SchedulingFieldsProps) => {
  const intl = useIntl();
  Settings.defaultLocale = intl.locale;
  Settings.defaultZone = 'utc';

  const [currentStartingAtDate, setCurrentStartingAtDate] = React.useState(
    startingAt
      ? DateTime.fromISO(startingAt)
          .set({ hour: 0, minute: 0, second: 0 })
          .toISO()
      : '',
  );
  const [timeSuggestions, setTimeSuggestions] =
    React.useState(allTimesSuggestions);
  const [currentStartingAtTime, setCurrentStartingAtTime] = React.useState(
    startingAt
      ? DateTime.fromISO(startingAt).toLocaleString(DateTime.TIME_24_SIMPLE)
      : '',
  );
  const [durationSuggestions, setDurationSuggestions] = React.useState(
    allDurationSuggestions,
  );
  const [currentEstimatedDuration, setCurrentEstimatedDuration] =
    React.useState(
      estimatedDuration
        ? displayedDuration(Duration.fromISOTime(estimatedDuration))
        : '',
    );

  const onStartingAtDateInputChange = (event: { value: string | string[] }) => {
    let value: string;
    if (Array.isArray(event.value)) {
      value = '';
      if (event.value.length > 0) {
        value = event.value[0];
      }
    } else {
      value = event.value;
    }
    setCurrentStartingAtDate(value);
    const updatedStartingAt = DateTime.fromISO(value).plus(
      Duration.fromISOTime(
        currentStartingAtTime ? currentStartingAtTime : '00:00:00',
      ),
    );
    onStartingAtChange(updatedStartingAt ? updatedStartingAt.toISO() : null);
  };

  const onStartingAtTimeInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value;
    setCurrentStartingAtTime(nextValue);
    if (!nextValue) setTimeSuggestions(allTimesSuggestions);
    else {
      const regexp = new RegExp(`^${nextValue}`);
      setTimeSuggestions(allTimesSuggestions.filter((s) => regexp.test(s)));
    }
    if (currentStartingAtDate) {
      const updatedStartingAt = DateTime.fromISO(currentStartingAtDate).plus(
        Duration.fromISOTime(nextValue),
      );
      onStartingAtChange(updatedStartingAt.toISO());
    }
  };

  const onStartingAtTimeSuggestionSelect = (event: {
    suggestion: React.SetStateAction<string>;
  }) => {
    setCurrentStartingAtTime(event.suggestion);
    if (currentStartingAtDate) {
      if (typeof event.suggestion === 'string') {
        const updatedStartingAt = DateTime.fromISO(currentStartingAtDate).plus(
          Duration.fromISOTime(event.suggestion),
        );
        onStartingAtChange(updatedStartingAt.toISO());
      }
    }
  };

  const onEstimatedDurationInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value;
    setCurrentEstimatedDuration(nextValue);
    if (!nextValue) {
      setDurationSuggestions(allDurationSuggestions);
    } else {
      const regexp = new RegExp(`^${nextValue}`);
      setDurationSuggestions(
        allDurationSuggestions.filter((s) => regexp.test(s)),
      );
    }
    if (onEstimatedDurationChange) {
      const estimatedDurationUpdated = returnedDuration(nextValue);
      if (estimatedDurationUpdated === 'Invalid Duration') {
        return;
      }
      onEstimatedDurationChange(estimatedDurationUpdated);
    }
  };

  const onEstimatedDurationSuggestionSelect = (event: {
    suggestion: React.SetStateAction<string>;
  }) => {
    setCurrentEstimatedDuration(event.suggestion);
    if (onEstimatedDurationChange) {
      if (typeof event.suggestion === 'string') {
        onEstimatedDurationChange(returnedDuration(event.suggestion));
      }
    }
  };

  return (
    <Box direction="row" justify="between" margin={margin} gap="medium">
      <FormField
        label={intl.formatMessage(messages.startingAtDateTextLabel)}
        htmlFor="starting_at_date"
        margin="none"
      >
        <DateInput
          id="starting_at_date"
          format={intl.locale === 'en' ? 'm/d/yyyy' : 'dd/mm/yyyy'}
          value={currentStartingAtDate || undefined}
          onChange={onStartingAtDateInputChange}
          calendarProps={{
            bounds: [
              DateTime.local().toISO(),
              DateTime.local().plus({ years: 1 }).toISO(),
            ],
          }}
        />
      </FormField>
      <FormField
        label={intl.formatMessage(messages.startingAtTimeTextLabel)}
        htmlFor="starting_at_time"
        margin="none"
      >
        <TextInput
          id="starting_at_time"
          value={currentStartingAtTime}
          onChange={onStartingAtTimeInputChange}
          onSuggestionSelect={onStartingAtTimeSuggestionSelect}
          suggestions={timeSuggestions}
          defaultSuggestion={22}
          placeholder="hh:mm"
          dropHeight="medium"
        />
      </FormField>
      <FormField
        label={intl.formatMessage(messages.estimatedDurationTextLabel)}
        htmlFor="estimated_duration"
        margin="none"
      >
        <TextInput
          id="estimated_duration"
          value={currentEstimatedDuration}
          onChange={onEstimatedDurationInputChange}
          onSuggestionSelect={onEstimatedDurationSuggestionSelect}
          suggestions={durationSuggestions}
          placeholder="hh:mm"
          dropHeight="medium"
        />
      </FormField>
    </Box>
  );
};

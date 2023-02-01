import {
  Box,
  DateInput,
  FormField,
  Text,
  TextInput,
  ThemeContext,
} from 'grommet';
import { MarginType } from 'grommet/utils';
import { calendarTheme, Nullable } from 'lib-common';
import { DateTime, Duration, Settings } from 'luxon';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { FormHelpText } from 'common/Form';

import { mergeDateTime, splitDateTime } from './utils';

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
  invalidStartingAt: {
    defaultMessage:
      '{updatedStartingAt} is not valid: Starting date and time should be set in the future.',
    description:
      'Error message when event scheduling date time update is in the past.',
    id: 'component.SchedulingFields.invalidStartingAt',
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
  if (durationString.length === 4) {
    durationString = '0' + durationString;
  }
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
  disabled?: boolean;
}

export const SchedulingFields = ({
  startingAt,
  estimatedDuration,
  onStartingAtChange,
  onEstimatedDurationChange,
  margin,
  disabled,
}: SchedulingFieldsProps) => {
  const intl = useIntl();
  Settings.defaultLocale = intl.locale;

  const { date, time } = splitDateTime(startingAt);
  const [currentStartingAtDate, setCurrentStartingAtDate] =
    React.useState(date);
  const [currentStartingAtTime, setCurrentStartingAtTime] =
    React.useState(time);

  const [timeSuggestions, setTimeSuggestions] =
    React.useState(allTimesSuggestions);

  const [durationSuggestions, setDurationSuggestions] = React.useState(
    allDurationSuggestions,
  );
  const [currentEstimatedDuration, setCurrentEstimatedDuration] =
    React.useState(
      estimatedDuration
        ? displayedDuration(Duration.fromISOTime(estimatedDuration))
        : '',
    );
  const [startingAtError, setStartingAtError] = useState<Nullable<string>>();

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
    onStartingAtChangeTrigger(value, currentStartingAtTime);
  };

  const onStartingAtChangeTrigger = (
    dateUpdated: string,
    timeUpdated: string,
  ) => {
    setCurrentStartingAtDate(dateUpdated);
    setCurrentStartingAtTime(timeUpdated);
    const updatedStartingAt = mergeDateTime(dateUpdated, timeUpdated);
    if (updatedStartingAt !== startingAt) {
      if (updatedStartingAt && updatedStartingAt < DateTime.local().toISO()) {
        setStartingAtError(
          intl.formatMessage(messages.invalidStartingAt, {
            updatedStartingAt: DateTime.fromISO(
              updatedStartingAt,
            ).toLocaleString(DateTime.DATETIME_MED),
          }),
        );
      } else {
        setStartingAtError(null);
        onStartingAtChange?.(updatedStartingAt);
      }
    }
  };

  const onStartingAtTimeInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value;
    if (!nextValue) {
      setTimeSuggestions(allTimesSuggestions);
    } else {
      const regexp = new RegExp(`^${nextValue}`);
      setTimeSuggestions(allTimesSuggestions.filter((s) => regexp.test(s)));
    }
    onStartingAtChangeTrigger(currentStartingAtDate, nextValue);
  };

  const onStartingAtTimeSuggestionSelect = (event: {
    suggestion: React.SetStateAction<string>;
  }) => {
    if (typeof event.suggestion === 'string' && event.suggestion) {
      onStartingAtChangeTrigger(currentStartingAtDate, event.suggestion);
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

  useEffect(() => {
    const { date: dateUpdated, time: timeUpdated } = splitDateTime(startingAt);
    setCurrentStartingAtDate(dateUpdated);
    setCurrentStartingAtTime(timeUpdated);
    setCurrentEstimatedDuration(
      estimatedDuration
        ? displayedDuration(Duration.fromISOTime(estimatedDuration))
        : '',
    );
  }, [startingAt, estimatedDuration]);

  return (
    <React.Fragment>
      <Box direction="row" justify="between" margin={margin} gap="small">
        <Box>
          <FormField
            label={intl.formatMessage(messages.startingAtDateTextLabel)}
            htmlFor="starting_at_date"
            margin="none"
            background={startingAtError ? 'status-error-off' : 'white'}
            // Fix of the calendar icon still clickable when component disabled (see below)
            style={{ pointerEvents: disabled ? 'none' : undefined }}
            height="80%"
            disabled={disabled}
          >
            <ThemeContext.Extend value={calendarTheme}>
              <DateInput
                dropProps={{
                  align: { top: 'bottom', left: 'left' },
                  style: {
                    borderRadius: '4px',
                    boxShadow: 'rgb(0 0 0 / 23%) 4px 5px 17px',
                  },
                }}
                id="starting_at_date"
                format={intl.locale === 'fr' ? 'dd/mm/yyyy' : 'yyyy/mm/dd'}
                value={currentStartingAtDate || undefined}
                onChange={onStartingAtDateInputChange}
                calendarProps={{
                  bounds: [
                    DateTime.local().toISO(),
                    DateTime.local().plus({ years: 1 }).toISO(),
                  ],
                }}
                // TODO : calendar icon still clickable even when component is disabled
                // need to open an issue on grommet's github
                disabled={disabled}
              />
            </ThemeContext.Extend>
          </FormField>
          <FormHelpText>
            {intl.locale === 'fr' ? 'dd/mm/yyyy' : 'yyyy/mm/dd'}
          </FormHelpText>
        </Box>
        <Box>
          <FormField
            label={intl.formatMessage(messages.startingAtTimeTextLabel)}
            htmlFor="starting_at_time"
            margin="none"
            background={startingAtError ? 'status-error-off' : 'white'}
            height="80%"
            disabled={disabled}
          >
            <TextInput
              id="starting_at_time"
              value={currentStartingAtTime}
              onChange={onStartingAtTimeInputChange}
              onSuggestionSelect={onStartingAtTimeSuggestionSelect}
              suggestions={timeSuggestions}
              defaultSuggestion={22}
              dropHeight="medium"
              disabled={disabled}
            />
          </FormField>
          <FormHelpText>hh:mm</FormHelpText>
        </Box>
        <Box>
          <FormField
            label={intl.formatMessage(messages.estimatedDurationTextLabel)}
            htmlFor="estimated_duration"
            margin="none"
            height="80%"
            disabled={disabled}
          >
            <TextInput
              id="estimated_duration"
              value={currentEstimatedDuration}
              onChange={onEstimatedDurationInputChange}
              onSuggestionSelect={onEstimatedDurationSuggestionSelect}
              suggestions={durationSuggestions}
              dropHeight="medium"
              disabled={disabled}
            />
          </FormField>
          <FormHelpText>hh:mm</FormHelpText>
        </Box>
      </Box>
      {startingAtError && (
        <Box margin={{ top: 'small' }}>
          <Text alignSelf="center" color="status-critical">
            {startingAtError}
          </Text>
        </Box>
      )}
    </React.Fragment>
  );
};

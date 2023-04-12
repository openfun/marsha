import { Nullable } from 'lib-common';
import { DateTime, Duration } from 'luxon';

export const splitDateTime = (
  dateTimeISO: Nullable<string>,
): { date: string; time: string } => {
  if (!dateTimeISO) {
    return { date: '', time: '' };
  }
  const dateTime = DateTime.fromISO(dateTimeISO);
  return {
    date: dateTime.toISODate() as string,
    time: dateTime.toLocaleString(DateTime.TIME_24_SIMPLE),
  };
};

export const mergeDateTime = (
  dateString: Nullable<string>,
  timeString: Nullable<string>,
): Nullable<string> => {
  if (!dateString || !timeString) {
    return null;
  }
  try {
    const time = Duration.fromISOTime(timeString);
    const dateTime = DateTime.fromISO(dateString).set({
      hour: time.hours,
      minute: time.minutes,
    });
    return dateTime.toISO();
  } catch (e) {
    return null;
  }
};

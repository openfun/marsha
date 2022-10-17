import { DateTime, Settings } from 'luxon';

import { mergeDateTime, splitDateTime } from './utils';

Settings.defaultZone = 'Europe/Paris';

describe('SchedulingFields/utils', () => {
  describe('splitDateTime', () => {
    it('splits a UTC dateTime string into date and time strings in local timezone', () => {
      const dateTime = DateTime.fromObject(
        { year: 2022, month: 4, day: 11, hour: 16, minute: 30 },
        { zone: 'UTC' },
      ).toISO();

      // dateTime is '2022-04-11T16:30:00Z';
      const { date, time } = splitDateTime(dateTime);

      expect(date).toEqual('2022-04-11');
      // Europe/Paris is UTC+2
      expect(time).toEqual('18:30');
    });

    it('sets the right date depending on local timezone', () => {
      // const dateTime = '2022-04-11T22:30:00Z';
      const dateTime = DateTime.fromObject(
        { year: 2022, month: 4, day: 11, hour: 22, minute: 30 },
        { zone: 'UTC' },
      ).toISO();

      const { date, time } = splitDateTime(dateTime);

      // Europe/Paris is UTC+2
      expect(date).toEqual('2022-04-12');
      expect(time).toEqual('00:30');
    });

    it('returns empty strings if dateTime is null', () => {
      const { date, time } = splitDateTime(null);

      expect(date).toEqual('');
      expect(time).toEqual('');
    });
  });

  describe('mergeDateTime', () => {
    it('merges date and time to dateTime ISO string in local timezone ', () => {
      const dateTime = mergeDateTime('2022-04-11', '18:30');

      const expectedDateTime = DateTime.fromObject(
        { year: 2022, month: 4, day: 11, hour: 18, minute: 30 },
        { zone: 'Europe/Paris' },
      ).toISO();
      // expectedDateTime is '2022-04-11T18:30:00+02:00';
      expect(dateTime).toEqual(expectedDateTime);
    });

    it('returns null if date is null', () => {
      const dateTime = mergeDateTime(null, '18:30');

      expect(dateTime).toEqual(null);
    });

    it('returns null if time is null', () => {
      const dateTime = mergeDateTime('2022-04-11', null);

      expect(dateTime).toEqual(null);
    });

    it('returns null if time is invalid', () => {
      const dateTime = mergeDateTime('2022-04-11', '1');

      expect(dateTime).toEqual(null);
    });
  });
});

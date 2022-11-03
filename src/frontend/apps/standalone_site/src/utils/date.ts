import { DateTime } from 'luxon';

export const localDate = (dateNotFormated: string, locale: string) => {
  const dt = DateTime.fromISO(dateNotFormated);
  return dt.isValid ? dt.setLocale(locale).toFormat('D  ·  tt') : null;
};

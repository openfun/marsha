import { Maybe } from 'lib-common';

const formatDigits = (value: number, locale: string) => {
  return value.toLocaleString(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
};

export const formatSecToTimeStamp = (
  duration: Maybe<number>,
  locale: string,
) => {
  let recordedTime = 'T00:00:00';
  if (duration) {
    const sec = formatDigits(duration % 60, locale);
    const min = formatDigits(Math.floor(duration / 60) % 60, locale);
    const hour = formatDigits(Math.floor(duration / 3600), locale);

    recordedTime = `T${hour}:${min}:${sec}`;
  }

  return recordedTime;
};

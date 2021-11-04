export const getDurationsFromStartingDate = (startingDate: Date) => {
  const time = startingDate.getTime() - new Date().getTime();
  const days = Math.trunc(time / (1000 * 3600 * 24));
  const ms = time - days * 1000 * 3600 * 24;
  return { time, days, ms };
};

export const getTHMSFromMs = (time: number) => {
  const sec = Math.floor((time / 1000) % 60);
  const min = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor((time / (1000 * 3600)) % 24);

  const h = hours < 10 ? `0${hours}` : hours;
  const m = min < 10 ? `0${min}` : min;
  const s = sec < 10 ? `0${sec}` : sec;

  return `T${h}:${m}:${s}`;
};

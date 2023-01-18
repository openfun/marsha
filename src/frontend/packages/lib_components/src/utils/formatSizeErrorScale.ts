export const formatSizeErrorScale = (maxSize: number): string => {
  const index =
    maxSize === 0 ? 0 : Math.floor(Math.log(maxSize) / Math.log(1000));
  return (
    ((maxSize / Math.pow(1000, index)) * 1).toFixed(0) +
    ' ' +
    ['B', 'kB', 'MB', 'GB', 'TB'][index]
  );
};

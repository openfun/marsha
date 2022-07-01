const SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

export const bytesToSize = (bytes: number | string | undefined) => {
  if (bytes === undefined) {
    return '';
  }
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (size === 0) {
    return '';
  }
  let unitIndex = parseInt(
    String(Math.floor(Math.log(size) / Math.log(1024))),
    10,
  );
  if (unitIndex === 0) {
    return `${bytes} ${SIZES[unitIndex]}`;
  }
  if (unitIndex > SIZES.length - 1) {
    unitIndex = SIZES.length - 1;
  }
  return `${(size / 1024 ** unitIndex).toFixed(1)} ${SIZES[unitIndex]}`;
};

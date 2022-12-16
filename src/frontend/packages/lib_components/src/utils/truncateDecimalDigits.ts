export const truncateDecimalDigits = (
  rawNumber: number,
  length = 3,
): number => {
  return parseFloat(rawNumber.toFixed(length));
};

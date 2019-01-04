export const truncateDecimalDigits = (
  rawNumber: number,
  length: number = 3,
): number => {
  return parseFloat(rawNumber.toFixed(length));
};

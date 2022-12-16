import { truncateDecimalDigits } from './truncateDecimalDigits';

describe('truncateDecimalDigits', () => {
  it('should keeps 3 digits number', () => {
    expect(truncateDecimalDigits(1.123456789)).toBe(1.123);
  });

  it('should keeps indicated digits number', () => {
    expect(truncateDecimalDigits(1.123456789, 1)).toBe(1.1);
  });

  it('should not pad with 0 if there is not enought digit numbers', () => {
    expect(truncateDecimalDigits(1.12)).toBe(1.12);
  });
});

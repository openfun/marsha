import { truncateFilename } from './truncateFilename';

describe('truncateFilename', () => {
  it('should keeps filename if it is shorter than maxLength', () => {
    expect(truncateFilename('filename', 8)).toBe('filename');
  });
  it('should keeps filename if maxLength equals the ellipsis length', () => {
    expect(truncateFilename('filename', 3)).toBe('filename');
  });
  it('should keeps filename if maxLength is shorter than the ellipsis', () => {
    expect(truncateFilename('filename', 2)).toBe('filename');
  });
  it('should truncate filename if it is longer than maxLength', () => {
    expect(truncateFilename('filename1234567890', 8)).toBe('filen[…]');
  });
  it('should truncate filename if it is longer than maxLength and has extension', () => {
    expect(truncateFilename('filename1234567890.ext', 8)).toBe('f[…].ext');
  });
  it('should return an empty string if filename is null', () => {
    expect(truncateFilename(null, 8)).toBe('');
  });
});

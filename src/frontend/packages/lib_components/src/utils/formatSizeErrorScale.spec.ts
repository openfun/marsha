import { formatSizeErrorScale } from './formatSizeErrorScale';

describe('lib_components/src/utils/formatSizeErrorScale.ts', () => {
  it('converts Bytes to the right human-readable scale', () => {
    expect(formatSizeErrorScale(10)).toEqual('10 B');
    expect(formatSizeErrorScale(Math.pow(10, 3))).toEqual('1 kB');
    expect(formatSizeErrorScale(Math.pow(10, 5))).toEqual('100 kB');
    expect(formatSizeErrorScale(Math.pow(10, 7))).toEqual('10 MB');
    expect(formatSizeErrorScale(Math.pow(10, 9))).toEqual('1 GB');
    expect(formatSizeErrorScale(Math.pow(10, 10))).toEqual('10 GB');
  });
});

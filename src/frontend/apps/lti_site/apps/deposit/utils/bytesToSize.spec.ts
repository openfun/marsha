import { bytesToSize } from './bytesToSize';

describe('bytesToSize', () => {
  it('should return an empty string if bytes is undefined', () => {
    expect(bytesToSize(undefined)).toBe('');
  });
  it('should return an empty string if bytes is 0', () => {
    expect(bytesToSize(0)).toBe('');
  });
  it('should return size in bytes if under 1024', () => {
    expect(bytesToSize(1023)).toBe('1023 Bytes');
  });
  it('should return size in KB if between 1024 and 1048576', () => {
    expect(bytesToSize(1024)).toBe('1.0 KB');
    expect(bytesToSize(1048575)).toBe('1024.0 KB');
  });
  it('should return size in MB if between 1048576 and 1073741824', () => {
    expect(bytesToSize(1048576)).toBe('1.0 MB');
    expect(bytesToSize(1073741823)).toBe('1024.0 MB');
  });
  it('should return size in GB if between 1073741824 and 1099511627776', () => {
    expect(bytesToSize(1073741824)).toBe('1.0 GB');
    expect(bytesToSize(1099511627775)).toBe('1024.0 GB');
  });
  it('should return size in TB if above 1099511627776', () => {
    expect(bytesToSize(1099511627776)).toBe('1.0 TB');
    expect(bytesToSize(1125899906842620)).toBe('1024.0 TB');
    expect(bytesToSize(11258999068426200)).toBe('10240.0 TB');
  });
});

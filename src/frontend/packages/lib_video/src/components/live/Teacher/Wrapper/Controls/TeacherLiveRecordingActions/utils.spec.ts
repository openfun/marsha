import { formatSecToTimeStamp } from './utils';

describe('TeacherLiveRecordingActions utils', () => {
  it('formats duration to string duration', () => {
    expect(formatSecToTimeStamp(3722, 'en')).toBe('T01:02:02');
  });
});

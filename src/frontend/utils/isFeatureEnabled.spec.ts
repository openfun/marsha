import { isFeatureEnabled } from './isFeatureEnabled';
import { Flags } from '../types/AppData';

let mockFlags = {};
jest.mock('../data/appData', () => ({
  appData: {
    get flags() {
      return mockFlags;
    },
  },
}));

describe('isFeatureEnabled', () => {
  it('returns true is flag is enabled', () => {
    mockFlags = { [Flags.VIDEO_LIVE]: true };
    expect(isFeatureEnabled(Flags.VIDEO_LIVE)).toBe(true);
  });

  it('returns false if flag is disabled', () => {
    mockFlags = { [Flags.VIDEO_LIVE]: false };
    expect(isFeatureEnabled(Flags.VIDEO_LIVE)).toBe(false);
  });

  it('returns false when flag is undefined', () => {
    mockFlags = {};
    expect(isFeatureEnabled(Flags.VIDEO_LIVE)).toBe(false);
  });
});

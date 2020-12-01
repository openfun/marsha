import { isFeatureEnabled } from './isFeatureEnabled';
import { flags } from '../types/AppData';

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
    mockFlags = { [flags.VIDEO_LIVE]: true };
    expect(isFeatureEnabled(flags.VIDEO_LIVE)).toBe(true);
  });

  it('returns false if flag is disabled', () => {
    mockFlags = { [flags.VIDEO_LIVE]: false };
    expect(isFeatureEnabled(flags.VIDEO_LIVE)).toBe(false);
  });

  it('returns false when flag is undefined', () => {
    mockFlags = {};
    expect(isFeatureEnabled(flags.VIDEO_LIVE)).toBe(false);
  });
});

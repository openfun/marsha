import { isFeatureEnabled } from './isFeatureEnabled';
import { flags } from '../types/AppData';

let mockAppData = {};
jest.mock('../data/appData', () => ({
  get appData() {
    return mockAppData;
  },
}));

describe('isFeatureEnabled', () => {
  it('returns true is flag is enabled', () => {
    mockAppData = {
      flags: {
        [flags.JITSI]: true,
      },
    };
    expect(isFeatureEnabled(flags.JITSI)).toBe(true);
  });

  it('returns false if flag is disabled', () => {
    mockAppData = {
      flags: {
        [flags.JITSI]: false,
      },
    };
    expect(isFeatureEnabled(flags.JITSI)).toBe(false);
  });

  it('returns false when the wanted flag is undefined', () => {
    mockAppData = {
      flags: {},
    };
    expect(isFeatureEnabled(flags.JITSI)).toBe(false);
  });

  it('returns false when flag is undefined', () => {
    mockAppData = {};
    expect(isFeatureEnabled(flags.JITSI)).toBe(false);
  });
});

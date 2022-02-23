import { flags } from 'types/AppData';

import { isFeatureEnabled } from './isFeatureEnabled';

let mockAppData = {};
jest.mock('data/appData', () => ({
  get appData() {
    return mockAppData;
  },
}));

describe('isFeatureEnabled', () => {
  it('returns true is flag is enabled', () => {
    mockAppData = {
      flags: {
        [flags.BBB]: true,
      },
    };
    expect(isFeatureEnabled(flags.BBB)).toBe(true);
  });

  it('returns false if flag is disabled', () => {
    mockAppData = {
      flags: {
        [flags.BBB]: false,
      },
    };
    expect(isFeatureEnabled(flags.BBB)).toBe(false);
  });

  it('returns false when the wanted flag is undefined', () => {
    mockAppData = {
      flags: {},
    };
    expect(isFeatureEnabled(flags.BBB)).toBe(false);
  });

  it('returns false when flag is undefined', () => {
    mockAppData = {};
    expect(isFeatureEnabled(flags.BBB)).toBe(false);
  });
});

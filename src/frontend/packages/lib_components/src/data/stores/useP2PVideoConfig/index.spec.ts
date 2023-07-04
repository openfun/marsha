import { useP2PConfig } from '.';

describe('useP2PConfig', () => {
  it('checks state', () => {
    expect(useP2PConfig.getState().isP2PEnabled).toBeFalsy();
    expect(useP2PConfig.getState().stunServersUrls.length).toBeFalsy();
    expect(
      useP2PConfig.getState().webTorrentServerTrackerUrls.length,
    ).toBeFalsy();

    useP2PConfig.getState().setP2PConfig(true, ['stun'], ['webtracker']);

    expect(useP2PConfig.getState().isP2PEnabled).toBeTruthy();
    expect(useP2PConfig.getState().stunServersUrls.length).toBeTruthy();
    expect(
      useP2PConfig.getState().webTorrentServerTrackerUrls.length,
    ).toBeTruthy();
  });
});

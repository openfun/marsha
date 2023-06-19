import { useP2PLiveConfig } from '.';

describe('useSentry', () => {
  it('checks isSentryReady', () => {
    expect(useP2PLiveConfig.getState().isP2PEnabled).toBeFalsy();
    expect(useP2PLiveConfig.getState().stunServersUrls.length).toBeFalsy();
    expect(
      useP2PLiveConfig.getState().webTorrentServerTrackerUrls.length,
    ).toBeFalsy();

    useP2PLiveConfig
      .getState()
      .setP2PLiveConfig(true, ['stun'], ['webtracker']);

    expect(useP2PLiveConfig.getState().isP2PEnabled).toBeTruthy();
    expect(useP2PLiveConfig.getState().stunServersUrls.length).toBeTruthy();
    expect(
      useP2PLiveConfig.getState().webTorrentServerTrackerUrls.length,
    ).toBeTruthy();
  });
});

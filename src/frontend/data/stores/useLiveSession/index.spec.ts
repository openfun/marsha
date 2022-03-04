import { liveSessionFactory } from 'utils/tests/factories';
import { useLiveSession } from '.';

describe('useLiveSession', () => {
  it('adds a live registration to the store', () => {
    expect(useLiveSession.getState().liveSession).toBeUndefined();
    const liveSession = liveSessionFactory();
    useLiveSession.getState().setLiveSession(liveSession);

    expect(useLiveSession.getState().liveSession).toEqual(liveSession);
  });
});

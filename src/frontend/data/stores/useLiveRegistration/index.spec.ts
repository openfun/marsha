import { liveRegistrationFactory } from 'utils/tests/factories';
import { useLiveRegistration } from '.';

describe('useLiveRegistration', () => {
  it('adds a live registration to the store', () => {
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();
    const liveRegistration = liveRegistrationFactory();
    useLiveRegistration.getState().setLiveRegistration(liveRegistration);

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });
});

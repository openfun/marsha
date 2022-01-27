import { useLiveStateStarted } from '.';

describe('useLiveStateStarted', () => {
  it('changes isStarted value', () => {
    expect(useLiveStateStarted.getState().isStarted).toEqual(false);

    useLiveStateStarted.getState().setIsStarted(true);

    expect(useLiveStateStarted.getState().isStarted).toEqual(true);
  });
});

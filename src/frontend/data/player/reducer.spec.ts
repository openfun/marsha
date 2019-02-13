import { player } from './reducer';

describe('Reducer: player', () => {
  const previousState = {
    currentTime: 1.5,
  };

  it('returns the state as is when called with an unknown action', () => {
    expect(player(previousState, { type: '' })).toEqual(previousState);
  });

  describe('PLAYER_TIME_UPDATE_NOTIFY', () => {
    it('updates the currentTime property', () => {
      const stateA = player(previousState, {
        currentTime: 3,
        type: 'PLAYER_TIME_UPDATE_NOTIFY',
      });

      expect(stateA).toEqual({
        currentTime: 3,
      });

      const stateB = player(stateA, {
        currentTime: 2.3,
        type: 'PLAYER_TIME_UPDATE_NOTIFY',
      });

      expect(stateB).toEqual({
        currentTime: 2.3,
      });
    });
  });
});

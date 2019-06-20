import { appState } from '../../types/AppData';
import { DecodedJwt } from '../../types/jwt';
import { Video } from '../../types/tracks';
import { context } from './reducer';

describe('Reducer: context', () => {
  const previousState = {
    decodedJwt: {} as DecodedJwt,
    jwt: 'some token',
    ltiResourceVideo: {} as Video,
    ltiState: appState.INSTRUCTOR,
  };

  it('returns the state as is when called with an unknown action', () => {
    expect(context(previousState, { type: '' })).toEqual(previousState);
  });
});

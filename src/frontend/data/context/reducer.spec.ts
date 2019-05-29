import { appState } from '../../types/AppData';
import { DecodedJwt } from '../../types/jwt';
import { Video } from '../../types/tracks';
import { context } from './reducer';

jest.mock('../appData', () => ({
  appData: {},
}));

describe('Reducer: context', () => {
  const previousState = {
    decodedJwt: {} as DecodedJwt,
    jwt: 'some token',
    ltiResourceVideo: {} as Video,
    ltiState: appState.INSTRUCTOR,
    uploads_progress: {},
  };

  it('returns the state as is when called with an unknown action', () => {
    expect(context(previousState, { type: '' })).toEqual(previousState);
  });

  describe('UPLOAD_PROGRESS_NOTIFY', () => {
    it('adds or sets the progress for the relevant object', () => {
      const stateA = context(previousState, {
        id: '42',
        progress: 10,
        type: 'UPLOAD_PROGRESS_NOTIFY',
      });

      expect(stateA).toEqual({
        decodedJwt: {} as DecodedJwt,
        jwt: 'some token',
        ltiResourceVideo: {} as Video,
        ltiState: appState.INSTRUCTOR,
        uploads_progress: { 42: 10 },
      });

      const stateB = context(stateA, {
        id: '42',
        progress: 90,
        type: 'UPLOAD_PROGRESS_NOTIFY',
      });

      expect(stateB).toEqual({
        decodedJwt: {} as DecodedJwt,
        jwt: 'some token',
        ltiResourceVideo: {} as Video,
        ltiState: appState.INSTRUCTOR,
        uploads_progress: { 42: 90 },
      });

      expect(
        context(stateB, {
          id: '43',
          progress: 45,
          type: 'UPLOAD_PROGRESS_NOTIFY',
        }),
      ).toEqual({
        decodedJwt: {} as DecodedJwt,
        jwt: 'some token',
        ltiResourceVideo: {} as Video,
        ltiState: appState.INSTRUCTOR,
        uploads_progress: { 42: 90, 43: 45 },
      });
    });
  });
});

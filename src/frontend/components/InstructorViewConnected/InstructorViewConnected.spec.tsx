import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { mapStateToProps } from './InstructorViewConnected';

describe('<InstructorViewConnected />', () => {
  describe('mapStateToProps()', () => {
    it('passes the context videoId', () => {
      const state = {
        context: {
          decodedJwt: {
            read_only: false,
          },
          ltiResourceVideo: {
            id: '42',
          },
        },
      } as RootState<appStateSuccess>;
      expect(mapStateToProps(state)).toEqual({
        readOnly: false,
        videoId: '42',
      });
    });
  });
});

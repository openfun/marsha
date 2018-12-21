import { RootState } from '../../data/rootReducer';
import { mapStateToProps } from './InstructorViewConnected';

describe('<InstructorViewConnected />', () => {
  describe('mapStateToProps()', () => {
    it('passes the context videoId', () => {
      const state = {
        context: {
          ltiResourceVideo: {
            id: '42',
          },
        },
      } as RootState;
      expect(mapStateToProps(state)).toEqual({ videoId: '42' });
    });

    it('defaults to null', () => {
      const state = { context: {} } as RootState;
      expect(mapStateToProps(state)).toEqual({ videoId: null });
    });
  });
});

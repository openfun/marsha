import { modelName } from '../../types/models';
import { mapStateToProps } from './VideoPlayerConnected';

describe('<VideoPlayerConnected />', () => {
  describe('mapStateToProps()', () => {
    const props = {
      video: { id: 42 } as any,
    };

    it('picks video from the store if available', () => {
      const state = {
        resources: {
          [modelName.VIDEOS]: { byId: { 42: 'some video' as any } },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        video: 'some video',
      });
    });

    it('defaults to the video from props', () => {
      let state = {
        resources: {
          [modelName.VIDEOS]: { byId: { 43: 'some video' as any } },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        video: { id: 42 },
      });

      state = {
        resources: {
          [modelName.VIDEOS]: { byId: {} },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        video: { id: 42 },
      });

      state = {
        resources: {
          [modelName.VIDEOS]: {},
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        video: { id: 42 },
      });
    });
  });
});

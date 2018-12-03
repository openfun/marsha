import { modelName } from '../../types/models';
import { mapStateToProps } from './VideoFormConnected';

describe('<VideoFormConnected />', () => {
  describe('mapStateToProps()', () => {
    const props = {
      jwt: 'some token',
      video: { id: 42 } as any,
    };

    it('picks video from the store if available', () => {
      const state = {
        context: { jwt: 'some token' },
        resources: {
          [modelName.VIDEOS]: { byId: { 42: 'some video' as any } },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'some token',
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

      state = undefined;
      expect(mapStateToProps(state, props)).toEqual({
        video: { id: 42 },
      });
    });
  });
});

import { modelName } from '../../types/models';
import { mapStateToProps } from './VideoPlayerConnected';

describe('<VideoPlayerConnected />', () => {
  describe('mapStateToProps()', () => {
    const props = {
      createPlayer: {} as any,
      jwt: 'foo',
      video: { id: 42 } as any,
    };

    it('picks video from the store if available', () => {
      const state = {
        context: {
          jwt: 'foo',
        },
        resources: {
          [modelName.VIDEOS]: { byId: { 42: 'some video' as any } },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'foo',
        video: 'some video',
      });
    });

    it('defaults to the video from props', () => {
      let state = {
        context: {
          jwt: 'foo',
        },
        resources: {
          [modelName.VIDEOS]: { byId: { 43: 'some video' as any } },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'foo',
        video: { id: 42 },
      });

      state = {
        context: {
          jwt: 'foo',
        },
        resources: {
          [modelName.VIDEOS]: { byId: {} },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'foo',
        video: { id: 42 },
      });

      state = {
        context: {
          jwt: 'foo',
        },
        resources: {
          [modelName.VIDEOS]: {},
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'foo',
        video: { id: 42 },
      });
    });
  });
});

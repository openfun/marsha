import { requestStatus } from '../../types/api';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
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
          [modelName.TIMEDTEXTTRACKS]: {},
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'foo',
        timedtexttracks: {
          objects: [],
          status: null,
        },
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
          [modelName.TIMEDTEXTTRACKS]: {},
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'foo',
        timedtexttracks: {
          objects: [],
          status: null,
        },
        video: { id: 42 },
      });

      state = {
        context: {
          jwt: 'foo',
        },
        resources: {
          [modelName.VIDEOS]: { byId: {} },
          [modelName.TIMEDTEXTTRACKS]: {},
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'foo',
        timedtexttracks: {
          objects: [],
          status: null,
        },
        video: { id: 42 },
      });

      state = {
        context: {
          jwt: 'foo',
        },
        resources: {
          [modelName.VIDEOS]: {},
          [modelName.TIMEDTEXTTRACKS]: {},
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'foo',
        timedtexttracks: {
          objects: [],
          status: null,
        },
        video: { id: 42 },
      });
    });

    it('retrieves timed text tracks from a successful query', () => {
      const state = {
        context: {
          jwt: 'foo',
        },
        resources: {
          [modelName.VIDEOS]: {},
          [modelName.TIMEDTEXTTRACKS]: {
            byId: {
              42: { id: '42' } as TimedText,
              84: { id: '84' } as TimedText,
              168: { id: '168' } as TimedText,
            },
            currentQuery: {
              items: { 0: '42', 1: '84', 2: '168' },
              status: requestStatus.SUCCESS,
            },
          },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'foo',
        timedtexttracks: {
          objects: [{ id: '42' }, { id: '84' }, { id: '168' }],
          status: requestStatus.SUCCESS,
        },
        video: { id: 42 },
      });
    });
  });
});

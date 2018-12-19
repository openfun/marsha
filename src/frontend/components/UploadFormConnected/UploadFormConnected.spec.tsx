import { modelName } from '../../types/models';
import { mapStateToProps } from './UploadFormConnected';

describe('<UploadFormConnected />', () => {
  describe('mapStateToProps()', () => {
    const props = {
      objectId: '42',
      objectType: modelName.VIDEOS,
    };

    it('picks the object from the store if available', () => {
      const state = {
        context: { jwt: 'some token' },
        resources: {
          [modelName.VIDEOS]: { byId: { 42: 'some video' as any } },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'some token',
        object: 'some video',
        objectType: modelName.VIDEOS,
      });
    });

    it('defaults to undefined', () => {
      const state = {
        context: { jwt: 'some token' },
        resources: {
          [modelName.VIDEOS]: { byId: { 43: 'some video' as any } },
        },
      } as any;
      expect(mapStateToProps(state, props)).toEqual({
        jwt: 'some token',
        object: undefined,
        objectType: modelName.VIDEOS,
      });
    });
  });
});

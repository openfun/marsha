import { getThumbnail } from './selector';

import { modelName } from '../../types/models';
import { Thumbnail } from '../../types/tracks';

describe('thumbnail/selector', () => {
  it('returns null if there is no thumbnail in state', () => {
    expect(
      getThumbnail({
        resources: {
          [modelName.THUMBNAIL]: {},
        },
      } as any),
    ).toEqual(null);
  });

  it('returns the first thumbnail found in the state', () => {
    const thumbnail = {
      id: 42,
    } as any;

    expect(
      getThumbnail({
        resources: {
          [modelName.THUMBNAIL]: {
            byId: {
              42: thumbnail,
            },
          },
        },
      } as any),
    ).toEqual(thumbnail);
  });
});

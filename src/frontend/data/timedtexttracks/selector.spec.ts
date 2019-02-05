import { requestStatus } from '../../types/api';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
import { getTimedTextTracks } from './selector';

describe('timedtexttracks/selector', () => {
  it('return objects and status from currentQuery', () => {
    expect(
      getTimedTextTracks({
        resources: {
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
      } as any),
    ).toEqual({
      objects: [{ id: '42' }, { id: '84' }, { id: '168' }],
      status: requestStatus.SUCCESS,
    });
  });

  it('return empty objects and status when no currentQuery', () => {
    expect(
      getTimedTextTracks({
        resources: {
          [modelName.TIMEDTEXTTRACKS]: {},
        },
      } as any),
    ).toEqual({
      objects: [],
      status: null,
    });
  });
});

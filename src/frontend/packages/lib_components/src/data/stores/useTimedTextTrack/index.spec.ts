import { modelName } from '@lib-components/types/models';

import { useTimedTextTrack } from '.';

describe('stores/useTimedTextTrack', () => {
  it('adds a resource to the store', () => {
    useTimedTextTrack.getState().addResource({ id: 'newResource' } as any);

    expect(
      useTimedTextTrack.getState()[modelName.TIMEDTEXTTRACKS].newResource,
    ).toEqual({ id: 'newResource' });
  });

  it('removes an existing resource', () => {
    useTimedTextTrack.getState().addResource({ id: 'toDelete' } as any);

    expect(
      useTimedTextTrack.getState()[modelName.TIMEDTEXTTRACKS].toDelete,
    ).toEqual({ id: 'toDelete' });

    useTimedTextTrack.getState().removeResource({ id: 'toDelete' } as any);

    expect(
      useTimedTextTrack.getState()[modelName.TIMEDTEXTTRACKS].toDelete,
    ).toBeUndefined();

    useTimedTextTrack
      .getState()
      .getTimedTextTracks()
      .forEach((timedtext) => {
        expect(timedtext).toBeDefined();
      });
  });

  it('adds multiple resources to the store', () => {
    useTimedTextTrack
      .getState()
      .addMultipleResources([
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

    expect(
      useTimedTextTrack.getState()[modelName.TIMEDTEXTTRACKS].multi1,
    ).toEqual({ id: 'multi1' });
    expect(
      useTimedTextTrack.getState()[modelName.TIMEDTEXTTRACKS].multi2,
    ).toEqual({ id: 'multi2' });
    expect(
      useTimedTextTrack.getState()[modelName.TIMEDTEXTTRACKS].multi3,
    ).toEqual({ id: 'multi3' });
  });
});

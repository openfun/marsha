import { createPlayer } from './createPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';

jest.mock('./createPlyrPlayer');

describe('createPlayer', () => {
  it('creates a plyr instance when type player is plyr', () => {
    const jwt = 'foo';
    const ref = 'ref' as any;
    const dispatch = jest.fn();

    createPlayer('plyr', ref, jwt, dispatch);

    expect(createPlyrPlayer).toHaveBeenCalledWith(ref, jwt, dispatch);
  });
});

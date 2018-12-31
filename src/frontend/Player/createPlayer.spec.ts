import { createPlayer } from './createPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';

jest.mock('./createPlyrPlayer');

describe('createPlayer', () => {
  it('creates a plyr instance when type player is plyr', () => {
    const jwt = 'foo';
    const ref = 'ref' as any;

    createPlayer('plyr', ref, jwt);

    expect(createPlyrPlayer).toHaveBeenCalledWith(ref, jwt);
  });
});

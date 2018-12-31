import { createPlyrPlayer } from './createPlyrPlayer';

jest.mock('plyr', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  }));
});
jest.mock('jwt-decode', () => {
  return jest.fn().mockImplementation(() => ({
    session_id: 'abcd',
  }));
});

describe('createPlyrPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('creates Plyr player and configure it', () => {
    const player = createPlyrPlayer('ref' as any, 'jwt');

    expect(player.on).toHaveBeenNthCalledWith(
      1,
      'canplay',
      expect.any(Function),
    );
    expect(player.on).toHaveBeenNthCalledWith(
      2,
      'playing',
      expect.any(Function),
    );
  });
});

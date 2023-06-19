import { generateVideoWebsocketUrl } from './websocket';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useJwt: {
    getState: () => ({
      jwt: 'cool_token_m8',
    }),
  },
}));

describe('generateVideoWebsocketUrl()', () => {
  it('generates base video url with http', () => {
    global.window ??= Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:1234/',
        host: 'localhost:1234',
        protocol: 'http',
      },
      writable: true,
    });

    expect(generateVideoWebsocketUrl('videoId')).toEqual(
      'ws://localhost:1234/ws/video/videoId/?jwt=cool_token_m8',
    );
  });

  it('generates base video url with https', () => {
    global.window ??= Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://localhost:1234/',
        host: 'localhost:1234',
        protocol: 'https',
      },
      writable: true,
    });

    expect(generateVideoWebsocketUrl('videoId')).toEqual(
      'wss://localhost:1234/ws/video/videoId/?jwt=cool_token_m8',
    );
  });

  it('calls the decorator with the expected url', () => {
    global.window ??= Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:1234/',
        host: 'localhost:1234',
        protocol: 'http',
      },
      writable: true,
    });

    const mockedDecorator = jest.fn();
    mockedDecorator.mockReturnValue('some_string');
    expect(generateVideoWebsocketUrl('videoId', mockedDecorator)).toEqual(
      'some_string',
    );
    expect(mockedDecorator).toHaveBeenCalledWith(
      'ws://localhost:1234/ws/video/videoId/?jwt=cool_token_m8',
    );
  });
});

const endpoint = 'https://example.com/update-state-endpoint/';
process.env.DISABLE_SSL_VALIDATION = 'false';
process.env.ENDPOINT = endpoint;
process.env.SHARED_SECRET = 'some secret';

// Use a stub to mock calls to the network
const requestStub = jest.fn();
jest.doMock('request-promise-native', () => requestStub);

// Don't pollute tests with logs intended for CloudWatch
const mockConsoleLog = jest.spyOn(console, 'log');

describe('lambda/update_state/src/updateState()', () => {
  beforeEach(() => {
    // Make sure to reset the modules so we get a chance to alter process.env between tests
    jest.resetModules();

    // Reset the mocks we'll be testing
    mockConsoleLog.mockReset();
    requestStub.mockReset();
  });

  it('calculates the signature and posts the new state to the server', async () => {
    const updateState = require('./updateState');

    await updateState('successful object key', 'ready');

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(`Updating state: POST ${endpoint}`);
    expect(anteLogArgument).toContain('successful object key');
    expect(anteLogArgument).toContain(
      'c39021355124558ee9300e4874c357c68dad40374b299eab747d5449b7572308',
    );
    expect(anteLogArgument).toContain('ready');

    const postLogArgument = mockConsoleLog.mock.calls[1][0];
    expect(postLogArgument).toEqual(
      `Updated successful object key. New state is (ready).`,
    );

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        key: 'successful object key',
        signature:
          'c39021355124558ee9300e4874c357c68dad40374b299eab747d5449b7572308',
        state: 'ready',
      },
      json: true,
      method: 'POST',
      strictSSL: true,
      uri: endpoint,
    });
  });

  it('disables SSL when DISABLE_SSL_VALIDATION is truthy', async () => {
    process.env.DISABLE_SSL_VALIDATION = 'true';
    const updateState = require('./updateState');

    await updateState('unsecure object key', 'ready');

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        key: 'unsecure object key',
        signature:
          '5206d32540bb479dbca49728cb8f9394fff6b32224b74c46eb59872f9ea3d60b',
        state: 'ready',
      },
      json: true,
      method: 'POST',
      strictSSL: false,
      uri: endpoint,
    });

    process.env.DISABLE_SSL_VALIDATION = 'false';
  });

  it('rejects when the request fails', async () => {
    const updateState = require('./updateState');
    requestStub.mockImplementation(
      () => new Promise((resolve, reject) => reject('Failed!')),
    );

    await expect(updateState('failed object key', 'ready')).rejects.toEqual(
      'Failed!',
    );

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(`Updating state: POST ${endpoint}`);
    expect(anteLogArgument).toContain('failed object key');
    expect(anteLogArgument).toContain(
      '59e04fa0b3b72bb529d88d40d96bd6c306d8d7a6963d9ae9b912da5fdba6f25f',
    );
    expect(anteLogArgument).toContain('ready');
  });
});

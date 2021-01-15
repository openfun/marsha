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
    const updateState = require('./');

    await updateState('successful object key', 'ready');

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(`Updating state: POST ${endpoint}`);
    expect(anteLogArgument).toContain('successful object key');
    expect(anteLogArgument).toContain('ready');

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        extraParameters: {},
        key: 'successful object key',
        state: 'ready',
      },
      headers: {
        'X-Marsha-Signature': 
          '4eafb44626868a63e882d96a9493476887beb30c06b6f9fe2a4ce35830a1b253',
      },
      json: true,
      method: 'POST',
      strictSSL: true,
      uri: endpoint,
    });
  });

  it('disables SSL when DISABLE_SSL_VALIDATION is truthy', async () => {
    process.env.DISABLE_SSL_VALIDATION = 'true';
    const updateState = require('./');

    await updateState('unsecure object key', 'ready');

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        extraParameters: {},
        key: 'unsecure object key',
        state: 'ready',
      },
      headers: {
        'X-Marsha-Signature': 
          '4d1750baf02c77e32951794f7c1826f2ee07a2d9769cd49230dc2f2a0272c2d4',
      },
      json: true,
      method: 'POST',
      strictSSL: false,
      uri: endpoint,
    });

    process.env.DISABLE_SSL_VALIDATION = 'false';
  });

  it('rejects when the request fails', async () => {
    process.env.DISABLE_SSL_VALIDATION = 'true';
    const updateState = require('./');

    requestStub.mockImplementation(
      () => new Promise((resolve, reject) => reject('Failed!')),
    );

    await expect(updateState('failed object key', 'ready')).rejects.toEqual(
      'Failed!',
    );

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        extraParameters: {},
        key: 'failed object key',
        state: 'ready',
      },
      headers: {
        'X-Marsha-Signature': 
          '8aff7aa52ed9a2203469a32eb2ad6f54f354f233d809bc3f7a6adbd8d760bb56',
      },
      json: true,
      method: 'POST',
      strictSSL: false,
      uri: endpoint,
    });

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(`Updating state: POST ${endpoint}`);
    expect(anteLogArgument).toContain('failed object key');
    expect(anteLogArgument).toContain('ready');
    process.env.DISABLE_SSL_VALIDATION = 'false';
  });
});

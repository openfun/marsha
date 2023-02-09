const endpoint = 'https://example.com/recording-slices-state/';
process.env.DISABLE_SSL_VALIDATION = 'false';
process.env.RECORDING_SLICES_STATE_ENDPOINT = endpoint;
process.env.SHARED_SECRET = 'some secret';

// Use a stub to mock calls to the network
const requestStub = jest.fn();
jest.doMock('request-promise-native', () => requestStub);

let mockConsoleLog;

describe('lambda/mediapackage/src/utils/recordSlicesState()', () => {
  beforeEach(() => {
    // Make sure to reset the modules so we get a chance to alter process.env between tests
    jest.resetModules();

    requestStub.mockReset();
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    mockConsoleLog = jest.spyOn(console, 'log');
    mockConsoleLog.mockImplementation();
  });

  it('calculates the signature and posts the new state to the server', async () => {
    const recordSlicesState = require('./');

    await recordSlicesState('successful object key');

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(
      `Checking video record slices states: POST ${endpoint}`,
    );
    expect(anteLogArgument).toContain('successful object key');

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        video_id: 'successful object key',
      },
      headers: {
        'X-Marsha-Signature':
          '592faceabf4f31e76ca17752a63e76dcecd6b5f9771691180da0c1df9a0837ab',
      },
      json: true,
      method: 'POST',
      strictSSL: true,
      uri: endpoint,
    });
  });

  it('disables SSL when DISABLE_SSL_VALIDATION is truthy', async () => {
    process.env.DISABLE_SSL_VALIDATION = 'true';
    const recordSlicesState = require('./');

    await recordSlicesState('unsecure object key');

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        video_id: 'unsecure object key',
      },
      headers: {
        'X-Marsha-Signature':
          'f6a859ac17188eead93b01e3fe4db2128ac5fa8ccb1e7d18cd025384cbf7cb78',
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
    const recordSlicesState = require('./');

    requestStub.mockImplementation(
      () => new Promise((resolve, reject) => reject('Failed!')),
    );

    await expect(recordSlicesState('failed object key')).rejects.toEqual(
      'Failed!',
    );

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        video_id: 'failed object key',
      },
      headers: {
        'X-Marsha-Signature':
          '5affc7adf63a9992e6c9d043f1cdf95a06f6161a39be51c7d2da09a3530dc800',
      },
      json: true,
      method: 'POST',
      strictSSL: false,
      uri: endpoint,
    });

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(
      `Checking video record slices states: POST ${endpoint}`,
    );
    expect(anteLogArgument).toContain('failed object key');
    process.env.DISABLE_SSL_VALIDATION = 'false';
  });
});

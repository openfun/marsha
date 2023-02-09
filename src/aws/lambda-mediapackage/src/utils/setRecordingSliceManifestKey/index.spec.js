const endpoint = 'https://example.com/recording-slices-manifest/';
process.env.DISABLE_SSL_VALIDATION = 'false';
process.env.RECORDING_SLICES_MANIFEST_ENDPOINT = endpoint;
process.env.SHARED_SECRET = 'some secret';

// Use a stub to mock calls to the network
const requestStub = jest.fn();
jest.doMock('request-promise-native', () => requestStub);

let mockConsoleLog;

describe('lambda/mediapackage/src/utils/setRecordingSliceManifestKey()', () => {
  beforeEach(() => {
    // Make sure to reset the modules so we get a chance to alter process.env between tests
    jest.resetModules();

    // Reset the mocks we'll be testing
    requestStub.mockReset();
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  it('calculates the signature and posts the new state to the server', async () => {
    const setRecordingSliceManifestKey = require('./');

    await setRecordingSliceManifestKey(
      'successful object key',
      'harvest job id',
      'manifest key',
    );

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(
      `Setting manifest for harvesting job Checking video record slices states: POST ${endpoint}`,
    );
    expect(anteLogArgument).toContain('successful object key');
    expect(anteLogArgument).toContain('harvest job id');
    expect(anteLogArgument).toContain('manifest key');

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        video_id: 'successful object key',
        harvest_job_id: 'harvest job id',
        manifest_key: 'manifest key',
      },
      headers: {
        'X-Marsha-Signature':
          'ff0e75d6929dd4e8a44b47b550a42bc51fd8db58d46ec5e8c31f9bff0c2c8862',
      },
      json: true,
      method: 'POST',
      strictSSL: true,
      uri: endpoint,
    });
  });

  it('disables SSL when DISABLE_SSL_VALIDATION is truthy', async () => {
    process.env.DISABLE_SSL_VALIDATION = 'true';
    const setRecordingSliceManifestKey = require('./');

    await setRecordingSliceManifestKey(
      'unsecure object key',
      'harvest job id',
      'manifest key',
    );

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        video_id: 'unsecure object key',
        harvest_job_id: 'harvest job id',
        manifest_key: 'manifest key',
      },
      headers: {
        'X-Marsha-Signature':
          '35e9636e496efb3b747826b62e837b20fd9ce0f9a95d497d3a269aeda7c3b7cd',
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
    const setRecordingSliceManifestKey = require('./');

    requestStub.mockImplementation(
      () => new Promise((resolve, reject) => reject('Failed!')),
    );

    await expect(
      setRecordingSliceManifestKey(
        'failed object key',
        'harvest job id',
        'manifest key',
      ),
    ).rejects.toEqual('Failed!');

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        video_id: 'failed object key',
        harvest_job_id: 'harvest job id',
        manifest_key: 'manifest key',
      },
      headers: {
        'X-Marsha-Signature':
          '3fe462457ff7f225b121859ce6b7585429c5b93f8651ff1a5070d27a0b40ab76',
      },
      json: true,
      method: 'POST',
      strictSSL: false,
      uri: endpoint,
    });

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(
      `Setting manifest for harvesting job Checking video record slices states: POST ${endpoint}`,
    );
    expect(anteLogArgument).toContain('failed object key');
    expect(anteLogArgument).toContain('harvest job id');
    expect(anteLogArgument).toContain('manifest key');
    process.env.DISABLE_SSL_VALIDATION = 'false';
  });
});

const endpoint = 'https://example.com/update-state-endpoint/';
process.env.ENDPOINT = endpoint;
process.env.SHARED_SECRET = 'some secret';

// Use a stub to mock calls to the network
const requestStub = jest.fn();
jest.doMock('request-promise-native', () => requestStub);

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log').mockReset();

const updateState = require('./updateState');

describe('lambda/update_state/src/updateState()', () => {
  it('calculates the signature and posts the new state to the server', async () => {
    await updateState('successful object key', 'ready');

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        key: 'successful object key',
        signature:
          'c39021355124558ee9300e4874c357c68dad40374b299eab747d5449b7572308',
        state: 'ready',
      },
      json: true,
      method: 'POST',
      uri: endpoint,
    });
  });

  it('rejects when the request fails', async () => {
    requestStub.mockImplementation(
      () => new Promise((resolve, reject) => reject('Failed!')),
    );

    await expect(
      updateState('successful object key', 'COMPLETE'),
    ).rejects.toEqual('Failed!');
  });
});

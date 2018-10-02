'use strict';

const endpoint = 'https://example.com/confirm-endpoint/';
process.env.ENDPOINT = endpoint;
process.env.SHARED_SECRET = 'some secret';

// Use a stub to mock calls to the network
const requestStub = jest.fn();
jest.mock('request-promise-native', () => requestStub);

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

const lambda = require('./index.js').handler;

describe('Confirm', () => {
  beforeEach(() => {
    requestStub.mockReset();
    console.log.mockReset();
  });

  it('calculates the signature and posts the new state to the server', async () => {
    const callback = jest.fn();
    const event = {
      detail: {
        userMetadata: {
          ObjectKey: 'successful object key',
        },
        status: 'COMPLETE',
      },
    };

    await lambda(event, null, callback);

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
    expect(callback).toHaveBeenCalled();
  });

  it('posts an error state when transcoding has failed', async () => {
    const callback = jest.fn();
    const event = {
      detail: {
        userMetadata: {
          ObjectKey: 'failed object key',
        },
        status: 'FAILURE',
      },
    };

    await lambda(event, null, callback);

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        key: 'failed object key',
        signature:
          '59e04fa0b3b72bb529d88d40d96bd6c306d8d7a6963d9ae9b912da5fdba6f25f',
        state: 'error',
      },
      json: true,
      method: 'POST',
      uri: endpoint,
    });
    expect(callback).toHaveBeenCalled();
  });

  it('triggers the callback with the error when the POST fails', async () => {
    const callback = jest.fn();
    const event = {
      detail: {
        userMetadata: {
          ObjectKey: 'object key that will fail to confirm',
        },
        status: 'COMPLETE',
      },
    };
    requestStub.mockImplementation(
      () => new Promise((resolve, reject) => reject('Failed!')),
    );

    await lambda(event, null, callback);

    expect(callback).toHaveBeenCalledWith('Failed!');
  });
});

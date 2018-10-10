'use strict';

const mockUpdateState = jest.fn();
jest.doMock('./src/updateState', () => mockUpdateState);

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log').mockReset();

const lambda = require('./index.js').handler;

describe('lambda', () => {
  it('calls updateState with "ready" when the task was "COMPLETE" and triggers the callback', async () => {
    const callback = jest.fn();
    const event = {
      detail: {
        userMetadata: {
          ObjectKey: 'some object key',
        },
        status: 'COMPLETE',
      },
    };

    await lambda(event, null, callback);

    expect(mockUpdateState).toHaveBeenCalledWith('some object key', 'ready');
    expect(callback).toHaveBeenCalledWith();
  });

  it('calls updateState with "error" when the task was not "COMPLETE and triggers the callback', async () => {
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

    expect(mockUpdateState).toHaveBeenCalledWith('failed object key', 'error');
    expect(callback).toHaveBeenCalledWith();
  });

  it('triggers the callback with an error when updateState failed', async () => {
    const callback = jest.fn();
    const event = {
      detail: {
        userMetadata: {
          ObjectKey: 'object key that will fail to update',
        },
        status: 'COMPLETE',
      },
    };

    mockUpdateState.mockImplementation(
      () => new Promise((resolve, reject) => reject('Failed to updateState!')),
    );

    await lambda(event, null, callback);

    expect(mockUpdateState).toHaveBeenCalledWith(
      'object key that will fail to update',
      'ready',
    );
    expect(callback).toHaveBeenCalledWith('Failed to updateState!');
  });
});

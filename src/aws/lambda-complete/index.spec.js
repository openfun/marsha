'use strict';

const mockUpdateState = jest.fn();
jest.doMock('update-state', () => mockUpdateState);

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
        outputGroupDetails: [
          {
            type: 'FILE_GROUP',
            outputDetails: [
              {
                outputFilePaths: [
                  's3://dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_144.mp4',
                ],
                videoDetails: {
                  widthInPx: 256,
                  heightInPx: 144,
                },
              },
            ],
          },
        ],
      },
    };

    await lambda(event, null, callback);

    expect(mockUpdateState).toHaveBeenCalledWith('some object key', 'ready', {
      resolutions: [144],
    });
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

    expect(mockUpdateState).toHaveBeenCalledWith(
      'failed object key',
      'error',
      {},
    );
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
        outputGroupDetails: [
          {
            type: 'FILE_GROUP',
            outputDetails: [
              {
                outputFilePaths: [
                  's3://dev-manu-marsha-destination/70795cbb-85b0-4742-bc89-d872fbf9fb5f/mp4/1551969052_144.mp4',
                ],
                videoDetails: {
                  widthInPx: 256,
                  heightInPx: 144,
                },
              },
            ],
          },
        ],
      },
    };

    mockUpdateState.mockImplementation(
      () => new Promise((resolve, reject) => reject('Failed to updateState!')),
    );

    await lambda(event, null, callback);

    expect(mockUpdateState).toHaveBeenCalledWith(
      'object key that will fail to update',
      'ready',
      {
        resolutions: [144],
      },
    );
    expect(callback).toHaveBeenCalledWith('Failed to updateState!');
  });
});

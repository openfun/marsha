import { uploadFile } from '.';

describe('sideEffects/uploadFile', () => {
  const mockProgressHandler = jest.fn();

  // Build a minimal mock for the xhr class. Allow the `Function` type to let us manage
  // event listener callbacks with no fuss.
  const callbacks: { [eventName: string]: Function } = {};
  const addEventListener = (eventName: string, callback: Function) => {
    callbacks[eventName] = callback;
  };
  const mockXHROpen = jest.fn();
  const mockXHRSend = jest.fn();
  const mockXHRInstance = {
    addEventListener,
    open: mockXHROpen,
    readyState: 0,
    send: mockXHRSend,
    status: 0,
    upload: { addEventListener },
  };
  const mockXHRClass = jest.fn().mockImplementation(() => mockXHRInstance);

  beforeEach(() => {
    (window as any).XMLHttpRequest = mockXHRClass;
  });

  it('makes an xhr POST to perform the upload, notifies of progress and resolves', async () => {
    // Create the promise but don't await it so we can simulate the ongoing request
    const response = uploadFile(
      'https://example.com/upload',
      'some form data' as any,
      mockProgressHandler,
    );

    expect(mockXHROpen).toHaveBeenCalledWith(
      'POST',
      'https://example.com/upload',
    );
    expect(mockXHRSend).toHaveBeenCalledWith('some form data');

    callbacks.progress({ lengthComputable: true, loaded: 0, total: 200 });
    expect(mockProgressHandler).toHaveBeenLastCalledWith(0);

    callbacks.progress({ lengthComputable: true, loaded: 10, total: 200 });
    expect(mockProgressHandler).toHaveBeenLastCalledWith(5);

    callbacks.progress({ lengthComputable: true, loaded: 133.33, total: 200 });
    expect(mockProgressHandler).toHaveBeenLastCalledWith(66);

    callbacks.progress({ lengthComputable: true, loaded: 199.99, total: 200 });
    expect(mockProgressHandler).toHaveBeenLastCalledWith(99);

    callbacks.progress({ lengthComputable: true, loaded: 200, total: 200 });
    expect(mockProgressHandler).toHaveBeenLastCalledWith(100);

    // The request finishes and succeeds
    mockXHRInstance.readyState = 4;
    mockXHRInstance.status = 204;
    callbacks.readystatechange();

    // Now we await the response to make sure it does resolve
    await expect(response).resolves.toEqual(true);
  });

  it('rejects when the upload fails', async () => {
    // Create the promise but don't await it so we can simulate the ongoing request
    const response = uploadFile(
      'https://example.com/upload',
      'some form data' as any,
      mockProgressHandler,
    );

    // The request finishes and fails
    mockXHRInstance.readyState = 4;
    mockXHRInstance.status = 400;
    callbacks.readystatechange();

    await expect(response).rejects.toEqual(
      new Error('Failed to perform the upload on https://example.com/upload.'),
    );
  });
});

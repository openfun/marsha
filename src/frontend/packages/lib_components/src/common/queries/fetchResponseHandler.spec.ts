import fetchMock from 'fetch-mock';

import { FetchResponseError } from '@lib-components/utils/errors/exception';

import { fetchResponseHandler } from './fetchResponseHandler';

describe('fetchResponseHandler', () => {
  afterEach(() => fetchMock.restore());

  it('checks a successful request', async () => {
    fetchMock.mock('/test/anything', {
      body: { name: 'John' },
      headers: { 'content-type': 'application/json' },
    });
    const response = await fetchResponseHandler(await fetch('/test/anything'));
    expect(response).toEqual({ name: 'John' });
  });

  it('checks a failed request 400', async () => {
    fetchMock.mock('/test/anything', {
      body: { name: 'John' },
      headers: { 'content-type': 'application/json' },
      status: 400,
    });

    let thrownError;
    try {
      await fetchResponseHandler(await fetch('/test/anything'));
    } catch (error) {
      if (error instanceof FetchResponseError) {
        thrownError = error.error;
      }
    }

    expect(thrownError).toEqual({
      code: 'invalid',
      message: 'Bad Request',
      name: 'John',
      status: 400,
      response: expect.objectContaining({
        status: 400,
      }),
      body: { name: 'John' },
    });
  });

  it('checks a failed request 500', async () => {
    fetchMock.mock('/test/anything', {
      body: { name: 'John' },
      headers: { 'content-type': 'application/json' },
      status: 500,
    });

    let thrownError;
    try {
      await fetchResponseHandler(await fetch('/test/anything'));
    } catch (error) {
      if (error instanceof FetchResponseError) {
        thrownError = error.error;
      }
    }

    expect(thrownError).toEqual({
      code: 'exception',
      message: 'Internal Server Error',
      name: 'John',
      status: 500,
      response: expect.objectContaining({
        status: 500,
      }),
      body: { name: 'John' },
    });
  });

  it('checks a failed request without body', async () => {
    fetchMock.mock('/test/anything', 500);

    let thrownError;
    try {
      await fetchResponseHandler(await fetch('/test/anything'));
    } catch (error) {
      if (error instanceof FetchResponseError) {
        thrownError = error.error;
      }
    }

    expect(thrownError).toEqual({
      code: 'exception',
      message: 'Internal Server Error',
      status: 500,
      response: expect.objectContaining({
        status: 500,
      }),
      body: {},
    });
  });

  describe('apiHelper options', () => {
    it('checks options.errorMessage as string', async () => {
      fetchMock.mock('/test/anything', 500);

      let thrownError;
      try {
        await fetchResponseHandler(await fetch('/test/anything'), {
          errorMessage: 'Test error',
        });
      } catch (error) {
        if (error instanceof FetchResponseError) {
          thrownError = error.error;
        }
      }

      expect(thrownError).toEqual({
        code: 'exception',
        message: 'Test error',
        status: 500,
        response: expect.objectContaining({
          status: 500,
        }),
        body: {},
      });
    });

    it('checks options.errorMessage as dict matching', async () => {
      fetchMock.mock('/test/anything', 500);

      let thrownError;
      try {
        await fetchResponseHandler(await fetch('/test/anything'), {
          errorMessage: { 500: 'Error 500' },
        });
      } catch (error) {
        if (error instanceof FetchResponseError) {
          thrownError = error.error;
        }
      }

      expect(thrownError).toEqual({
        code: 'exception',
        message: 'Error 500',
        status: 500,
        response: expect.objectContaining({
          status: 500,
        }),
        body: {},
      });
    });

    it('checks options.errorMessage as dict not matching', async () => {
      fetchMock.mock('/test/anything', 500);

      let thrownError;
      try {
        await fetchResponseHandler(await fetch('/test/anything'), {
          errorMessage: { 400: 'Error 400' },
        });
      } catch (error) {
        if (error instanceof FetchResponseError) {
          thrownError = error.error;
        }
      }

      expect(thrownError).toEqual({
        code: 'exception',
        message: 'Internal Server Error',
        status: 500,
        response: expect.objectContaining({
          status: 500,
        }),
        body: {},
      });
    });

    it('checks options.invalidStatus', async () => {
      fetchMock.mock('/test/anything', 500);

      let thrownError;
      try {
        await fetchResponseHandler(await fetch('/test/anything'), {
          invalidStatus: [500],
        });
      } catch (error) {
        if (error instanceof FetchResponseError) {
          thrownError = error.error;
        }
      }

      expect(thrownError).toEqual({
        code: 'invalid',
        message: 'Internal Server Error',
        status: 500,
        response: expect.objectContaining({
          status: 500,
        }),
        body: {},
      });
    });

    it('checks options.withoutBody', async () => {
      fetchMock.mock('/test/anything', {
        body: { name: 'John' },
        headers: { 'content-type': 'application/json' },
        status: 500,
      });

      let thrownError;
      try {
        await fetchResponseHandler(await fetch('/test/anything'), {
          withoutBody: true,
        });
      } catch (error) {
        if (error instanceof FetchResponseError) {
          thrownError = error.error;
        }
      }

      expect(thrownError).toEqual({
        code: 'exception',
        message: 'Internal Server Error',
        status: 500,
        response: expect.objectContaining({
          status: 500,
        }),
      });
    });
  });
});

import fetchMock from 'fetch-mock';

import { useJwt } from 'data/stores/useJwt';

import { createDepositedFile } from '.';

describe('sideEffects/createDepositedFile', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => fetchMock.restore());

  it('creates a new deposited file and returns it', async () => {
    fetchMock.mock('/api/depositedfiles/', {
      id: 'shared_live_media_id',
      is_ready_to_show: false,
      show_download: true,
      upload_state: 'pending',
      video: 'video_id',
    });

    const depositedFile = await createDepositedFile();

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(depositedFile).toEqual({
      id: 'shared_live_media_id',
      is_ready_to_show: false,
      show_download: true,
      upload_state: 'pending',
      video: 'video_id',
    });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create the deposited file (request failure)', async () => {
    fetchMock.mock(
      '/api/depositedfiles/',
      Promise.reject(new Error('Failed to perform the request')),
    );

    await expect(createDepositedFile()).rejects.toThrowError(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to create the deposited file (API error)', async () => {
    fetchMock.mock('/api/depositedfiles/', 400);

    await expect(createDepositedFile()).rejects.toThrowError(
      'Failed to create a new deposited file.',
    );
  });
});

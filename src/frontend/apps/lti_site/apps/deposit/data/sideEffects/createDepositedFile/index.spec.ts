import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

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
    const file = new File(['anrusitanrsui tnarsuit narsuit'], 'TestFile.txt');

    const depositedFile = await createDepositedFile({
      size: file.size,
      filename: file.name,
    });

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
    const file = new File(['anrusitanrsui tnarsuit narsuit'], 'TestFile.txt');

    await expect(
      createDepositedFile({ size: file.size, filename: file.name }),
    ).rejects.toThrow();
  });

  it('throws when it fails to create the deposited file (API error)', async () => {
    fetchMock.mock('/api/depositedfiles/', 400);
    const file = new File(['anrusitanrsui tnarsuit narsuit'], 'TestFile.txt');

    await expect(
      createDepositedFile({ size: file.size, filename: file.name }),
    ).rejects.toThrow();
  });
});

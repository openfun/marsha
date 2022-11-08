/* eslint-disable @typescript-eslint/no-non-null-assertion */
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

import { classroomDocumentMockFactory } from 'utils/tests/factories';

import { createClassroomDocument } from '.';

describe('sideEffects/createClassroomDocument', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => fetchMock.restore());

  it('creates a new deposited file and returns it', async () => {
    const file = new File(['anrusitanrsui tnarsuit narsuit'], 'TestFile.txt');
    const classroomDocument = classroomDocumentMockFactory({
      filename: file.name,
    });
    fetchMock.mock('/api/classroomdocuments/', classroomDocument);

    const createdClassroomDocument = await createClassroomDocument({
      filename: file.name,
      size: file.size,
    });

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(createdClassroomDocument).toEqual(classroomDocument);
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create the deposited file (request failure)', async () => {
    fetchMock.mock(
      '/api/classroomdocuments/',
      Promise.reject(new Error('Failed to perform the request')),
    );
    const file = new File(['anrusitanrsui tnarsuit narsuit'], 'TestFile.txt');

    await expect(
      createClassroomDocument({ filename: file.name, size: file.size }),
    ).rejects.toThrowError('Failed to perform the request');
  });

  it('throws when it fails to create the deposited file (API error)', async () => {
    fetchMock.mock('/api/classroomdocuments/', 400);
    const file = new File(['anrusitanrsui tnarsuit narsuit'], 'TestFile.txt');

    await expect(
      createClassroomDocument({ filename: file.name, size: file.size }),
    ).rejects.toThrowError('Failed to create a new classroom document.');
  });
});

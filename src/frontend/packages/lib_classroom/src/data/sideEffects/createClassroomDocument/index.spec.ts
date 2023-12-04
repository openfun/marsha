import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

import { classroomDocumentMockFactory } from '@lib-classroom/tests/factories';

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
    fetchMock.mock(
      `/api/classrooms/${classroomDocument.classroom_id}/classroomdocuments/`,
      classroomDocument,
    );

    const createdClassroomDocument = await createClassroomDocument({
      filename: file.name,
      size: file.size,
      classroom_id: classroomDocument.classroom_id,
    });

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(createdClassroomDocument).toEqual(classroomDocument);
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to create the deposited file (request failure)', async () => {
    const file = new File(['anrusitanrsui tnarsuit narsuit'], 'TestFile.txt');
    const classroomDocument = classroomDocumentMockFactory();
    fetchMock.mock(
      `/api/classrooms/${classroomDocument.classroom_id}/classroomdocuments/`,
      Promise.reject(new Error('Failed to perform the request')),
    );
    await expect(
      createClassroomDocument({
        filename: file.name,
        size: file.size,
        classroom_id: classroomDocument.classroom_id,
      }),
    ).rejects.toThrow('Failed to perform the request');
  });

  it('throws when it fails to create the deposited file (API error)', async () => {
    const file = new File(['anrusitanrsui tnarsuit narsuit'], 'TestFile.txt');
    const classroomDocument = classroomDocumentMockFactory();
    fetchMock.mock(
      `/api/classrooms/${classroomDocument.classroom_id}/classroomdocuments/`,
      400,
    );
    await expect(
      createClassroomDocument({
        filename: file.name,
        size: file.size,
        classroom_id: classroomDocument.classroom_id,
      }),
    ).rejects.toThrow();
  });
});

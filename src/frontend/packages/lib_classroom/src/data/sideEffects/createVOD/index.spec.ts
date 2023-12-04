import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

import { classroomRecordingMockFactory } from '@lib-classroom/tests/factories';

import { createVOD } from '.';

describe('sideEffects/createVOD', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => fetchMock.restore());

  it('calls create-vod for a classroom recording', async () => {
    const classroomRecording = classroomRecordingMockFactory();
    fetchMock.mock(
      `/api/classrooms/${classroomRecording.classroom_id}/recordings/${classroomRecording.id}/create-vod/`,
      {
        key: 'value',
      },
    );

    const response = await createVOD(classroomRecording, 'my title');

    const fetchArgs = fetchMock.lastCall()![1]!;

    expect(response).toEqual({ key: 'value' });
    expect(fetchArgs.headers).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
    });
    expect(fetchArgs.method).toEqual('POST');
  });

  it('throws when it fails to call create-vod (request failure)', async () => {
    const classroomRecording = classroomRecordingMockFactory();
    fetchMock.mock(
      `/api/classrooms/${classroomRecording.classroom_id}/recordings/${classroomRecording.id}/create-vod/`,
      Promise.reject(new Error('Failed to perform the request')),
    );
    await expect(createVOD(classroomRecording, 'my title')).rejects.toThrow(
      'Failed to perform the request',
    );
  });

  it('throws when it fails to call create-vod (API error)', async () => {
    const classroomRecording = classroomRecordingMockFactory();
    fetchMock.mock(
      `/api/classrooms/${classroomRecording.classroom_id}/recordings/${classroomRecording.id}/create-vod/`,
      400,
    );
    await expect(createVOD(classroomRecording, 'my title')).rejects.toThrow();
  });
});

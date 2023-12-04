import fetchMock from 'fetch-mock';
import { classroomMockFactory } from 'lib-classroom/tests';

import { validateClassroomInviteToken } from '.';

describe('validateClassroomInvite()', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('throws an error if request failed', async () => {
    const classroom = classroomMockFactory({
      public_token: 'foo',
    });
    fetchMock.get(
      `/api/classrooms/${classroom.id}/token/?invite_token=${classroom.public_token}`,
      500,
    );

    await expect(
      validateClassroomInviteToken(classroom.id, classroom.public_token),
    ).rejects.toThrow('Internal Server Error');
  });

  it('returns the access token', async () => {
    const accessTokenResponse = {
      access_token: 'valid_jwt',
    };
    const classroom = classroomMockFactory({
      public_token: 'foo',
    });
    fetchMock.get(
      `/api/classrooms/${classroom.id}/token/?invite_token=${classroom.public_token}`,
      accessTokenResponse,
    );

    expect(
      await validateClassroomInviteToken(classroom.id, classroom.public_token),
    ).toEqual(accessTokenResponse);
  });
});

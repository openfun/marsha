import {
  FetchResponseError,
  TokenResponse,
  fetchResponseHandler,
  fetchWrapper,
} from 'lib-components';

export type ValidateClassroomInviteError = FetchResponseError<{
  code: string;
  message: string;
}>;

export interface IValidateClassroomInvite {
  access_token: TokenResponse['access'];
}

export const validateClassroomInviteToken = async (
  classroomId: string,
  token: string,
) => {
  const response = await fetchWrapper(
    `/api/classrooms/${classroomId}/token/?invite_token=${token}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return await fetchResponseHandler<IValidateClassroomInvite>(response);
};

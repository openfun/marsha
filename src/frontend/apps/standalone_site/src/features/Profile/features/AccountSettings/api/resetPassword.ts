import { Maybe } from 'lib-common';
import { fetchResponseHandler, fetchWrapper, useJwt } from 'lib-components';

export interface ResetPasswordError {
  old_password?: string[];
  new_password1?: string[];
  new_password2?: string[];
}

export const resetPassword = async (
  currentPassword: Maybe<string>,
  newPassword: Maybe<string>,
  passwordValidation: Maybe<string>,
): Promise<void> => {
  const jwt = useJwt.getState().getJwt();

  const response = await fetchWrapper('/account/api/password/change/', {
    headers: {
      Authorization: `Bearer ${jwt || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      old_password: currentPassword,
      new_password1: newPassword,
      new_password2: passwordValidation,
    }),
    method: 'POST',
  });

  await fetchResponseHandler<void>(response);
};

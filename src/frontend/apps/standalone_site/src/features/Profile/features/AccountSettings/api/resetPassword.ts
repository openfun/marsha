import { Maybe } from 'lib-common';
import { fetchWrapper, useJwt } from 'lib-components';

export const resetPassword = async (
  currentPassword: Maybe<string>,
  newPassword: Maybe<string>,
  passwordValidation: Maybe<string>,
) => {
  const jwt = useJwt.getState().jwt;

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

  if (!response.ok) {
    throw await response.json();
  }
};

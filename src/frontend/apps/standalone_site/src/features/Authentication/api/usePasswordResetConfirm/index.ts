import { fetchWrapper } from 'lib-components';
import { useMutation, UseMutationOptions } from 'react-query';

type UsePasswordResetConfirmData = {
  uid: string;
  token: string;
  new_password1: string;
  new_password2: string;
};
export type UsePasswordResetConfirmError = {
  code: 'exception';
  detail?: string;
};

type UsePasswordResetConfirmResponseData = {
  detail: string;
};

type UsePasswordResetConfirmOptions = UseMutationOptions<
  UsePasswordResetConfirmResponseData,
  UsePasswordResetConfirmError,
  UsePasswordResetConfirmData
>;

const actionPasswordResetConfirm = async ({
  object,
}: {
  object: UsePasswordResetConfirmData;
}): Promise<UsePasswordResetConfirmResponseData> => {
  const response = await fetchWrapper('/account/api/password/reset/confirm/', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(object),
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      throw { code: 'invalid', ...(await response.json()) };
    }
    throw { code: 'exception' };
  }

  return (await response.json()) as UsePasswordResetConfirmResponseData;
};

export const usePasswordResetConfirm = (
  options?: UsePasswordResetConfirmOptions,
) => {
  return useMutation<
    UsePasswordResetConfirmResponseData,
    UsePasswordResetConfirmError,
    UsePasswordResetConfirmData
  >(
    (object) =>
      actionPasswordResetConfirm({
        object,
      }),
    options,
  );
};

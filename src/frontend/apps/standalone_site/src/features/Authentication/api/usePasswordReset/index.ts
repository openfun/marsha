import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { fetchWrapper } from 'lib-components';

type UsePasswordResetData = {
  email: string;
  confirm_url: string;
};
export type UsePasswordResetError = { code: 'exception'; detail?: string };

type UsePasswordResetResponseData = {
  detail: string;
};

type UsePasswordResetOptions = UseMutationOptions<
  UsePasswordResetResponseData,
  UsePasswordResetError,
  UsePasswordResetData
>;

const actionPasswordReset = async ({
  object,
}: {
  object: UsePasswordResetData;
}): Promise<UsePasswordResetResponseData> => {
  const response = await fetchWrapper('/account/api/password/reset/', {
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

  return (await response.json()) as UsePasswordResetResponseData;
};

export const usePasswordReset = (options?: UsePasswordResetOptions) => {
  return useMutation<
    UsePasswordResetResponseData,
    UsePasswordResetError,
    UsePasswordResetData
  >({
    mutationFn: (object) =>
      actionPasswordReset({
        object,
      }),
    ...options,
  });
};

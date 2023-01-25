import { fetchWrapper, useJwt, TokenResponse } from 'lib-components';
import { useMutation, UseMutationOptions } from 'react-query';

type UseBasicLoginData = {
  username: string;
  password: string;
};
export type UseBasicLoginError = { code: 'exception'; detail?: string };

type UseBasicLoginOptions = UseMutationOptions<
  TokenResponse,
  UseBasicLoginError,
  UseBasicLoginData
>;

const actionLogin = async ({
  object,
}: {
  object: UseBasicLoginData;
}): Promise<TokenResponse> => {
  const response = await fetchWrapper('/account/api/token/', {
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

  return (await response.json()) as TokenResponse;
};

export const useBasicLogin = (options?: UseBasicLoginOptions) => {
  const { setJwt, setRefreshJwt } = useJwt((state) => ({
    setJwt: state.setJwt,
    setRefreshJwt: state.setRefreshJwt,
  }));

  return useMutation<TokenResponse, UseBasicLoginError, UseBasicLoginData>(
    (basicCredentials) =>
      actionLogin({
        object: basicCredentials,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        setJwt(data.access);
        setRefreshJwt(data.refresh);
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

import { useJwt } from 'lib-components';
import { useMutation, UseMutationOptions } from 'react-query';

import { validateChallenge } from '../validateChallenge';

type UseBasicLoginData = {
  username: string;
  password: string;
};
export type UseBasicLoginError = { code: 'exception'; detail?: string };

type UseBasicLoginResponseData = {
  challenge_token: string;
};

type UseBasicLoginOptions = UseMutationOptions<
  UseBasicLoginResponseData,
  UseBasicLoginError,
  UseBasicLoginData
>;

const actionLogin = async ({
  object,
}: {
  object: UseBasicLoginData;
}): Promise<UseBasicLoginResponseData> => {
  const response = await fetch('/account/api/login/', {
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

  return (await response.json()) as UseBasicLoginResponseData;
};

export const useBasicLogin = (options?: UseBasicLoginOptions) => {
  const { setJwt } = useJwt((state) => ({
    setJwt: state.setJwt,
  }));

  return useMutation<
    UseBasicLoginResponseData,
    UseBasicLoginError,
    UseBasicLoginData
  >(
    (basicCredentials) =>
      actionLogin({
        object: basicCredentials,
      }),
    {
      ...options,
      onSuccess: async (data, variables, context) => {
        setJwt(await validateChallenge(data.challenge_token));
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

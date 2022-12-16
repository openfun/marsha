import { useJwt } from 'lib-components';
import { useMutation, UseMutationOptions } from 'react-query';

type UseBasicLoginData = {
  username: string;
  password: string;
};
export type UseBasicLoginError = { code: 'exception'; detail?: string };

type UseBasicLoginResponseData = {
  access: string;
  refresh: string;
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
  const response = await fetch('/account/api/token/', {
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
  const { setJwt, setRefreshJwt } = useJwt((state) => ({
    setJwt: state.setJwt,
    setRefreshJwt: state.setRefreshJwt,
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

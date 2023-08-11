import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import {
  FetchResponseError,
  TokenResponse,
  fetchResponseHandler,
  fetchWrapper,
  useJwt,
} from 'lib-components';

type UseBasicLoginData = {
  username: string;
  password: string;
};

export interface UseBasicLoginErrorBody {
  username?: string[];
  password?: string[];
  detail?: string;
}

export type UseBasicLoginError = FetchResponseError<UseBasicLoginErrorBody>;

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

  return await fetchResponseHandler(response, {
    invalidStatus: [400, 401],
  });
};

export const useBasicLogin = (options?: UseBasicLoginOptions) => {
  const { setJwt, setRefreshJwt } = useJwt((state) => ({
    setJwt: state.setJwt,
    setRefreshJwt: state.setRefreshJwt,
  }));

  return useMutation<TokenResponse, UseBasicLoginError, UseBasicLoginData>({
    mutationFn: (basicCredentials) =>
      actionLogin({
        object: basicCredentials,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      setJwt(data.access);
      setRefreshJwt(data.refresh);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

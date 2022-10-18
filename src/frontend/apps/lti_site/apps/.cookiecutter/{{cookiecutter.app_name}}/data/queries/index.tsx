import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from 'react-query';

import { createOne, fetchList, FetchListQueryKey, fetchOne, updateOne } from 'lib-components';
import { APIList } from 'lib-components';
import { Maybe } from 'utils/types';

import { {{cookiecutter.model}} } from 'lib-components';

type {{cookiecutter.model_plural}}Response = APIList<{{cookiecutter.model}}>;
type Use{{cookiecutter.model_plural}}Params = { organization: Maybe<string> };
export const use{{cookiecutter.model_plural}} = (
  params: Use{{cookiecutter.model_plural}}Params,
  queryConfig?: UseQueryOptions<
    {{cookiecutter.model_plural}}Response,
    '{{cookiecutter.model_url_part}}',
    {{cookiecutter.model_plural}}Response,
    FetchListQueryKey
  >,
) => {
  const key: FetchListQueryKey = ['{{cookiecutter.model_url_part}}', params];
  return useQuery<
    {{cookiecutter.model_plural}}Response,
    '{{cookiecutter.model_url_part}}',
    {{cookiecutter.model_plural}}Response,
    FetchListQueryKey
  >(key, fetchList, queryConfig);
};

interface {{cookiecutter.model_plural}}SelectResponse {
  new_url: string;
  {{cookiecutter.model_plural_lower}}: {{cookiecutter.model}}[];
}
export const useSelect{{cookiecutter.model}} = (
  queryConfig?: UseQueryOptions<
    {{cookiecutter.model_plural}}SelectResponse,
    '{{cookiecutter.model_url_part}}',
    {{cookiecutter.model_plural}}SelectResponse
  >,
) => {
  const key = ['{{cookiecutter.model_url_part}}', 'lti-select'];
  return useQuery<{{cookiecutter.model_plural}}SelectResponse, '{{cookiecutter.model_url_part}}'>(
    key,
    fetchOne,
    queryConfig,
  );
};

export const use{{cookiecutter.model}} = (
  {{cookiecutter.model_lower}}Id: string,
  queryConfig?: UseQueryOptions<{{cookiecutter.model}}, '{{cookiecutter.model_url_part}}', {{cookiecutter.model}}>,
) => {
  const key = ['{{cookiecutter.model_url_part}}', {{cookiecutter.model_lower}}Id];
  return useQuery<{{cookiecutter.model}}, '{{cookiecutter.model_url_part}}'>(key, fetchOne, queryConfig);
};

type UseCreate{{cookiecutter.model}}Data = {
  playlist: string;
  title: string;
  description?: string;
  lti_id?: string;
};
type UseCreate{{cookiecutter.model}}Error =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreate{{cookiecutter.model}}Data]?: string[] }[];
    };
type UseCreate{{cookiecutter.model}}Options = UseMutationOptions<
  {{cookiecutter.model}},
  UseCreate{{cookiecutter.model}}Error,
  UseCreate{{cookiecutter.model}}Data
>;
export const useCreate{{cookiecutter.model}} = (options?: UseCreate{{cookiecutter.model}}Options) => {
  const queryClient = useQueryClient();
  return useMutation<{{cookiecutter.model}}, UseCreate{{cookiecutter.model}}Error, UseCreate{{cookiecutter.model}}Data>(
    (new{{cookiecutter.model}}) => createOne({ name: '{{cookiecutter.model_url_part}}', object: new{{cookiecutter.model}} }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('{{cookiecutter.model_url_part}}');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

type UseUpdate{{cookiecutter.model}}Data = Partial<
  Omit<{{cookiecutter.model}}, 'portable_to'> & { portable_to: string[] }
>;
type UseUpdate{{cookiecutter.model}}Error =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdate{{cookiecutter.model}}Data]?: string[] }[];
    };
type UseUpdate{{cookiecutter.model}}Options = UseMutationOptions<
  {{cookiecutter.model}},
  UseUpdate{{cookiecutter.model}}Error,
  UseUpdate{{cookiecutter.model}}Data
>;
export const useUpdate{{cookiecutter.model}} = (
  id: string,
  options?: UseUpdate{{cookiecutter.model}}Options,
) => {
  const queryClient = useQueryClient();
  return useMutation<{{cookiecutter.model}}, UseUpdate{{cookiecutter.model}}Error, UseUpdate{{cookiecutter.model}}Data>(
    (updated{{cookiecutter.model}}) =>
      updateOne({ name: '{{cookiecutter.model_url_part}}', id, object: updated{{cookiecutter.model}} }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('{{cookiecutter.model_url_part}}');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('{{cookiecutter.model_url_part}}');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

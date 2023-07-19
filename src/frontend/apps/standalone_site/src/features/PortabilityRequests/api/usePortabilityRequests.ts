import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  APIList,
  FetchListQueryKey,
  PortabilityRequest,
  actionOne,
  fetchList,
} from 'lib-components';

type UsePortabilityRequestsParams = {
  limit: string;
  offset: string;
  ordering: string;
  state?: string;
  for_playlist_id?: string;
};

export const usePortabilityRequests = (
  params: UsePortabilityRequestsParams,
  queryConfig?: UseQueryOptions<
    APIList<PortabilityRequest>,
    'portability-requests',
    APIList<PortabilityRequest>,
    FetchListQueryKey
  >,
) => {
  const keys: FetchListQueryKey = ['portability-requests', params];
  return useQuery<
    APIList<PortabilityRequest>,
    'portability-requests',
    APIList<PortabilityRequest>,
    FetchListQueryKey
  >({ queryKey: keys, queryFn: fetchList, ...queryConfig });
};

type MutationPortabilityRequestData<PortabilityRequest> =
  Partial<PortabilityRequest>;
type MutationPortabilityRequestError<PortabilityRequest> =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: {
        [key in keyof MutationPortabilityRequestData<PortabilityRequest>]?: string[];
      }[];
    };
type MutationPortabilityRequestOptions<
  _PortabilityRequestResponse,
  PortabilityRequestRequest,
> = UseMutationOptions<
  MutationPortabilityRequestData<PortabilityRequestRequest>,
  MutationPortabilityRequestError<PortabilityRequestRequest>,
  MutationPortabilityRequestData<PortabilityRequestRequest>
>;
enum MutationPortabilityRequestAction {
  ACCEPT_REQUEST = 'accept',
  REJECT_REQUEST = 'reject',
}
const PortabilityRequestActionMutation = <
  PortabilityRequestResponse,
  PortabilityRequestRequest,
>(
  action: MutationPortabilityRequestAction,
  method: 'POST' | 'PATCH',
) => {
  function usePortabilityRequestActionMutation(
    id: string,
    options?: MutationPortabilityRequestOptions<
      PortabilityRequestResponse,
      PortabilityRequestRequest
    >,
    doNotInvalidateQueries?: boolean,
  ) {
    const queryClient = useQueryClient();
    return useMutation<
      MutationPortabilityRequestData<PortabilityRequestRequest>,
      MutationPortabilityRequestError<PortabilityRequestRequest>,
      MutationPortabilityRequestData<PortabilityRequestRequest>
    >({
      mutationFn: (object) =>
        actionOne({
          name: 'portability-requests',
          id,
          action,
          method,
          object,
        }),
      ...options,
      onSuccess: (data, variables, context) => {
        if (!doNotInvalidateQueries) {
          queryClient.invalidateQueries(['portability-requests']);
        }
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        if (!doNotInvalidateQueries) {
          queryClient.invalidateQueries(['portability-requests']);
        }
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    });
  }
  return usePortabilityRequestActionMutation;
};

export const acceptPortabilityRequest = PortabilityRequestActionMutation<
  PortabilityRequest,
  Pick<PortabilityRequest, 'id'>
>(MutationPortabilityRequestAction.ACCEPT_REQUEST, 'POST');
export const rejectPortabilityRequest = PortabilityRequestActionMutation<
  PortabilityRequest,
  Pick<PortabilityRequest, 'id'>
>(MutationPortabilityRequestAction.REJECT_REQUEST, 'POST');

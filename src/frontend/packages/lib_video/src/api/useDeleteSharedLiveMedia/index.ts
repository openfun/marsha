import { Maybe } from 'lib-common';
import { deleteOne, SharedLiveMedia } from 'lib-components';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

type UseDeleteSharedLiveMediaData = string;
type UseDeleteSharedLiveMediaError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseDeleteSharedLiveMediaData]?: string[] }[];
    };
type UseDeleteSharedLiveMediaOptions = UseMutationOptions<
  Maybe<SharedLiveMedia>,
  UseDeleteSharedLiveMediaError,
  UseDeleteSharedLiveMediaData
>;
export const useDeleteSharedLiveMedia = (
  options?: UseDeleteSharedLiveMediaOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Maybe<SharedLiveMedia>,
    UseDeleteSharedLiveMediaError,
    UseDeleteSharedLiveMediaData
  >(
    (sharedLiveMediaId) =>
      deleteOne({
        name: 'sharedlivemedias',
        id: sharedLiveMediaId,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('sharedlivemedias');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('sharedlivemedias');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

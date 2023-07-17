import { Maybe } from 'lib-common';
import { FetchResponseError, SharedLiveMedia, deleteOne } from 'lib-components';
import { UseMutationOptions, useMutation, useQueryClient } from 'react-query';

type UseDeleteSharedLiveMediaData = {
  videoId: string;
  sharedLiveMediaId: string;
};
type UseDeleteSharedLiveMediaError =
  FetchResponseError<UseDeleteSharedLiveMediaData>;
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
    ({ videoId, sharedLiveMediaId }) =>
      deleteOne({
        name: `videos/${videoId}/sharedlivemedias`,
        id: sharedLiveMediaId,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(
          `videos/${variables.videoId}/sharedlivemedias`,
        );
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries(
          `videos/${variables.videoId}/sharedlivemedias`,
        );
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

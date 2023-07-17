import { FetchResponseError, bulkDelete } from 'lib-components';
import { UseMutationOptions, useMutation, useQueryClient } from 'react-query';

type UseDeleteVideosData = { ids: string[] };
type UseDeleteVideosError = FetchResponseError<UseDeleteVideosData>;
type UseDeleteVideosOptions = UseMutationOptions<
  void,
  UseDeleteVideosError,
  UseDeleteVideosData
>;
export const useDeleteVideos = (options?: UseDeleteVideosOptions) => {
  const queryClient = useQueryClient();
  return useMutation<void, UseDeleteVideosError, UseDeleteVideosData>(
    (videoIds) =>
      bulkDelete({
        name: 'videos',
        objects: videoIds,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('videos');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('videos');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

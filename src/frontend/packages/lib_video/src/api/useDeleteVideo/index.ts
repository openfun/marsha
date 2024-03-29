import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Maybe } from 'lib-common';
import { FetchResponseError, Video, deleteOne } from 'lib-components';

type UseDeleteVideoData = string;
type UseDeleteVideoError = FetchResponseError<UseDeleteVideoData>;
type UseDeleteVideoOptions = UseMutationOptions<
  Maybe<Video>,
  UseDeleteVideoError,
  UseDeleteVideoData
>;
export const useDeleteVideo = (options?: UseDeleteVideoOptions) => {
  const queryClient = useQueryClient();
  return useMutation<Maybe<Video>, UseDeleteVideoError, UseDeleteVideoData>({
    mutationFn: (videoId) =>
      deleteOne({
        name: 'videos',
        id: videoId,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['videos']);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries(['videos']);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

import { Maybe } from 'lib-common';
import { deleteOne, FetchResponseError, Thumbnail } from 'lib-components';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

type UseDeleteThumbnailData = {
  videoId: string;
  thumbnailId: string;
};
type UseDeleteThumbnailError = FetchResponseError<UseDeleteThumbnailData>;
type UseDeleteThumbnailOptions = UseMutationOptions<
  Maybe<Thumbnail>,
  UseDeleteThumbnailError,
  UseDeleteThumbnailData
>;
export const useDeleteThumbnail = (options?: UseDeleteThumbnailOptions) => {
  const queryClient = useQueryClient();
  return useMutation<
    Maybe<Thumbnail>,
    UseDeleteThumbnailError,
    UseDeleteThumbnailData
  >(
    ({ videoId, thumbnailId }) =>
      deleteOne({
        name: `videos/${videoId}/thumbnails`,
        id: thumbnailId,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(`videos/${variables.videoId}/thumbnails`);
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries(`videos/${variables.videoId}/thumbnails`);
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

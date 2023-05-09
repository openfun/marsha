import { Maybe } from 'lib-common';
import { deleteOne, Thumbnail } from 'lib-components';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

type UseDeleteThumbnailData = string;
type UseDeleteThumbnailError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseDeleteThumbnailData]?: string[] }[];
    };
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
    (thumbnailId) =>
      deleteOne({
        name: 'thumbnails',
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

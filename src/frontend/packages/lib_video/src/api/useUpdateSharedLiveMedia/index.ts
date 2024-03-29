import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { SharedLiveMedia, updateOne } from 'lib-components';

type UseUpdateSharedLiveMediaData = Partial<SharedLiveMedia>;
type UseUpdateSharedLiveMediaError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdateSharedLiveMediaData]?: string[] }[];
    };
type UseUpdateSharedLiveMediaOptions = UseMutationOptions<
  SharedLiveMedia,
  UseUpdateSharedLiveMediaError,
  UseUpdateSharedLiveMediaData
>;
export const useUpdateSharedLiveMedia = (
  videoId: string,
  id: string,
  options?: UseUpdateSharedLiveMediaOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    SharedLiveMedia,
    UseUpdateSharedLiveMediaError,
    UseUpdateSharedLiveMediaData
  >({
    mutationFn: (updatedSharedLiveMedia) =>
      updateOne({
        name: `videos/${videoId}/sharedlivemedias`,
        id,
        object: updatedSharedLiveMedia,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries([`videos/${videoId}/sharedlivemedias`]);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries([`videos/${videoId}/sharedlivemedias`]);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

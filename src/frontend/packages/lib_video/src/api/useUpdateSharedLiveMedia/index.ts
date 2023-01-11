import { SharedLiveMedia, updateOne } from 'lib-components';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

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
  id: string,
  options?: UseUpdateSharedLiveMediaOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    SharedLiveMedia,
    UseUpdateSharedLiveMediaError,
    UseUpdateSharedLiveMediaData
  >(
    (updatedSharedLiveMedia) =>
      updateOne({
        name: 'sharedlivemedias',
        id,
        object: updatedSharedLiveMedia,
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

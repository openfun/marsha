import { SharedLiveMedia, actionOne } from 'lib-components';
import { UseMutationOptions, useMutation, useQueryClient } from 'react-query';

type UseStartSharingData = { sharedlivemedia: string };
type UseStartSharingError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseStartSharingData]?: string[] }[];
    };
type UseStartSharingLiveMediaOptions = UseMutationOptions<
  SharedLiveMedia,
  UseStartSharingError,
  UseStartSharingData
>;
export const useStartSharingMedia = (
  videoId: string,
  options?: UseStartSharingLiveMediaOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    SharedLiveMedia,
    UseStartSharingError,
    UseStartSharingData
  >(
    (sharedLiveMedia) =>
      actionOne({
        name: 'videos',
        id: videoId,
        action: 'start-sharing',
        method: 'PATCH',
        object: sharedLiveMedia,
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

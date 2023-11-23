import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { FetchResponseError, SharedLiveMedia, actionOne } from 'lib-components';

type UseStartSharingData = { sharedlivemedia: string };
type UseStartSharingError = FetchResponseError<UseStartSharingData>;
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
  >({
    mutationFn: (sharedLiveMedia) =>
      actionOne({
        name: 'videos',
        id: videoId,
        action: 'start-sharing',
        method: 'PATCH',
        object: sharedLiveMedia,
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

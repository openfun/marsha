import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { SharedLiveMedia, actionOne } from 'lib-components';

type UseStopSharingData = { sharedlivemedia: string };
type UseStopSharingError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseStopSharingData]?: string[] }[];
    };
type UseStopSharingLiveMediaOptions = UseMutationOptions<
  SharedLiveMedia,
  UseStopSharingError
>;
export const useStopSharingMedia = (
  videoId: string,
  options?: UseStopSharingLiveMediaOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<SharedLiveMedia, UseStopSharingError>({
    mutationFn: () =>
      actionOne({
        name: 'videos',
        id: videoId,
        action: 'end-sharing',
        method: 'PATCH',
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

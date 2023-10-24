import { Maybe } from '@lib-common/types';
import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  FetchResponseError,
  TimedText,
  Video,
  actionOne,
  useVideo,
} from 'lib-components';

type UseGenerateTranscriptData = {
  videoId: string;
};
type UseGenerateTranscriptError = FetchResponseError<UseGenerateTranscriptData>;
type UseGenerateTranscriptOptions = UseMutationOptions<
  Maybe<TimedText>,
  UseGenerateTranscriptError,
  UseGenerateTranscriptData
>;

export const useGenerateTranscript = (
  options?: UseGenerateTranscriptOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Maybe<TimedText>,
    UseGenerateTranscriptError,
    UseGenerateTranscriptData
  >({
    mutationFn: ({ videoId }) =>
      actionOne({
        name: 'videos',
        id: videoId,
        action: 'transcript',
        method: 'GET',
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries([`videos/${variables.videoId}/transcript`]);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries([`videos/${variables.videoId}/transcript`]);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

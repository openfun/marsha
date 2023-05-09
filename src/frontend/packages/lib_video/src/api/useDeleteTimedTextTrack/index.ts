import { Maybe } from 'lib-common';
import { deleteOne, TimedText } from 'lib-components';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

type UseDeleteTimedTextTrackData = string;
type UseDeleteTimedTextTrackError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseDeleteTimedTextTrackData]?: string[] }[];
    };
type UseDeleteTimedTextTrackOptions = UseMutationOptions<
  Maybe<TimedText>,
  UseDeleteTimedTextTrackError,
  UseDeleteTimedTextTrackData
>;
export const useDeleteTimedTextTrack = (
  options?: UseDeleteTimedTextTrackOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Maybe<TimedText>,
    UseDeleteTimedTextTrackError,
    UseDeleteTimedTextTrackData
  >(
    (timedTextTrackId) =>
      deleteOne({
        name: 'timedtexttracks',
        id: timedTextTrackId,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(
          `videos/${variables.videoId}/timedtexttracks`,
        );
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries(
          `videos/${variables.videoId}/timedtexttracks`,
        );
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

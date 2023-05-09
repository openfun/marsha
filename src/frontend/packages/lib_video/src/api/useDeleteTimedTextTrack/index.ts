import { Maybe } from 'lib-common';
import { deleteOne, FetchResponseError, TimedText } from 'lib-components';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

type UseDeleteTimedTextTrackData = {
  videoId: string;
  timedTextTrackId: string;
};
type UseDeleteTimedTextTrackError =
  FetchResponseError<UseDeleteTimedTextTrackData>;
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
    ({ videoId, timedTextTrackId }) =>
      deleteOne({
        name: `videos/${videoId}/timedtexttracks`,
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

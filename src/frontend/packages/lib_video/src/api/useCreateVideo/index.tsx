import { Nullable } from 'lib-common';
import {
  LiveModeType,
  uploadState,
  createOne,
  Video,
  FetchResponseError,
} from 'lib-components';
import { UseMutationOptions, useQueryClient, useMutation } from 'react-query';

export type UseCreateVideoData = {
  playlist: string;
  title: string;
  description?: string;
  lti_id?: string;
  live_type?: Nullable<LiveModeType>;
  upload_state?: uploadState;
};
type UseCreateVideoError = FetchResponseError<UseCreateVideoData>;
type UseCreateVideoOptions = UseMutationOptions<
  Video,
  UseCreateVideoError,
  UseCreateVideoData
>;
export const useCreateVideo = (options?: UseCreateVideoOptions) => {
  const queryClient = useQueryClient();
  return useMutation<Video, UseCreateVideoError, UseCreateVideoData>(
    (newVideo) => createOne({ name: 'videos', object: newVideo }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('videos');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

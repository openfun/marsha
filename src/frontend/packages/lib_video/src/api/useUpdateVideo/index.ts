import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Video, updateOne } from 'lib-components';

type UseUpdateVideoData = Partial<Video>;
type UseUpdateVideoError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdateVideoData]?: string[] }[];
    };
type UseUpdateVideoOptions = UseMutationOptions<
  Video,
  UseUpdateVideoError,
  UseUpdateVideoData
>;
export const useUpdateVideo = (id: string, options?: UseUpdateVideoOptions) => {
  const queryClient = useQueryClient();
  return useMutation<Video, UseUpdateVideoError, UseUpdateVideoData>({
    mutationFn: (updatedVideo) =>
      updateOne({ name: 'videos', id, object: updatedVideo }),
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

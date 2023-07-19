import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { deleteOne } from 'lib-components';

type UseDeletePlaylistAccessData = string;
type UseDeletePlaylistAccessError = { code: 'exception' };
type UseDeletePlaylistAccessOptions = UseMutationOptions<
  unknown,
  UseDeletePlaylistAccessError,
  UseDeletePlaylistAccessData
>;
export const useDeletePlaylistAccess = (
  options?: UseDeletePlaylistAccessOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    UseDeletePlaylistAccessError,
    UseDeletePlaylistAccessData
  >({
    mutationFn: (playlistAccess) =>
      deleteOne({
        name: 'playlist-accesses',
        id: playlistAccess,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['playlist-accesses']);

      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries(['playlist-accesses']);

      options?.onError?.(error, variables, context);
    },
  });
};

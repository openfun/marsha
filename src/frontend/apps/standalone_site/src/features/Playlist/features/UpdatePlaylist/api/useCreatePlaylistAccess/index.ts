import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { FetchResponseError, createOne } from 'lib-components';

import { PlaylistAccess, PlaylistRole } from '../../types/playlistAccess';

type UseCreatePlaylistAccessData = {
  playlist: string;
  role: PlaylistRole;
  user: string;
};
type UseCreatePlaylistAccessError =
  FetchResponseError<UseCreatePlaylistAccessData>;

export const useCreatePlaylistAccess = (
  options?: UseMutationOptions<
    PlaylistAccess,
    UseCreatePlaylistAccessError,
    UseCreatePlaylistAccessData
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    PlaylistAccess,
    UseCreatePlaylistAccessError,
    UseCreatePlaylistAccessData
  >({
    mutationFn: (newPlaylistAccess) =>
      createOne({
        name: 'playlist-accesses',
        object: newPlaylistAccess,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['playlist-accesses']);
      options?.onSuccess?.(data, variables, context);
    },
  });
};

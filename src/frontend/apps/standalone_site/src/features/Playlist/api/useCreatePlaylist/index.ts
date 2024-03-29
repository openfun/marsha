import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Nullable } from 'lib-common';
import { Playlist, createOne } from 'lib-components';

type UseCreatePlaylistData = {
  organization: string;
  title: string;
  retention_duration: Nullable<number>;
};
type UseCreatePlaylistError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreatePlaylistData]?: string[] };
    }[];

export const useCreatePlaylist = (
  options?: UseMutationOptions<
    Playlist,
    UseCreatePlaylistError,
    UseCreatePlaylistData
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<Playlist, UseCreatePlaylistError, UseCreatePlaylistData>({
    mutationFn: (newPlaylist) =>
      createOne({
        name: 'playlists',
        object: { ...newPlaylist, consumer_site: null },
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['playlists']);
      options?.onSuccess?.(data, variables, context);
    },
  });
};

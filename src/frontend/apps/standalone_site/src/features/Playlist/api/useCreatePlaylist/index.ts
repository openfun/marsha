import { createOne, Playlist } from 'lib-components';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

type UseCreatePlaylistData = {
  organization: string;
  title: string;
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
  return useMutation<Playlist, UseCreatePlaylistError, UseCreatePlaylistData>(
    (newPlaylist) =>
      createOne({
        name: 'playlists',
        object: { ...newPlaylist, consumer_site: null },
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(['playlists']);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

import { Maybe } from 'lib-common';
import { FetchResponseError, Playlist, deleteOne } from 'lib-components';
import { UseMutationOptions, useMutation, useQueryClient } from 'react-query';

type UseDeletePlaylistData = string;
type UseDeletePlaylistError = FetchResponseError<UseDeletePlaylistData>;
type UseDeletePlaylistOptions = UseMutationOptions<
  Maybe<Playlist>,
  UseDeletePlaylistError,
  UseDeletePlaylistData
>;
export const useDeletePlaylist = (options?: UseDeletePlaylistOptions) => {
  const queryClient = useQueryClient();
  return useMutation<
    Maybe<Playlist>,
    UseDeletePlaylistError,
    UseDeletePlaylistData
  >(
    (playlistId) =>
      deleteOne({
        name: 'playlists',
        id: playlistId,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('playlists');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('playlists');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

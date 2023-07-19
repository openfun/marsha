import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Nullable } from 'lib-common';
import { Playlist, updateOne } from 'lib-components';

type UseUpdatePlaylistData = {
  organization: string;
  title: string;
  retention_duration: Nullable<number>;
};
type UseUpdatePlaylistError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdatePlaylistData]?: string[] };
    }[];

export const useUpdatePlaylist = (
  id: string,
  options?: UseMutationOptions<
    Playlist,
    UseUpdatePlaylistError,
    UseUpdatePlaylistData
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<Playlist, UseUpdatePlaylistError, UseUpdatePlaylistData>({
    mutationFn: (newPlaylist) =>
      updateOne({
        name: 'playlists',
        id,
        object: newPlaylist,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['playlists']);
      options?.onSuccess?.(data, variables, context);
    },
  });
};

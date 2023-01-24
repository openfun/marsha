import { updateOne } from 'lib-components';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import { PlaylistAccess, PlaylistRole } from '../../types/playlistAccess';

type UseUpdatePlaylistAccessData = {
  role: PlaylistRole;
};
type UseUpdatePlaylistAccessError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdatePlaylistAccessData]?: string[] };
    }[];

export const useUpdatePlaylistAcess = (
  id: string,
  options?: UseMutationOptions<
    PlaylistAccess,
    UseUpdatePlaylistAccessError,
    UseUpdatePlaylistAccessData
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    PlaylistAccess,
    UseUpdatePlaylistAccessError,
    UseUpdatePlaylistAccessData
  >(
    (newPlaylistAccess) =>
      updateOne({
        name: 'playlist-accesses',
        id,
        object: newPlaylistAccess,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(['playlist-accesses']);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

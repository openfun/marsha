import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { Playlist, fetchOne } from 'lib-components';

export const usePlaylist = (
  id: string,
  queryConfig?: UseQueryOptions<Playlist, 'playlists', Playlist, string[]>,
) => {
  const keys = ['playlists', id];
  return useQuery<Playlist, 'playlists', Playlist, string[]>({
    queryKey: keys,
    queryFn: fetchOne,
    ...queryConfig,
  });
};

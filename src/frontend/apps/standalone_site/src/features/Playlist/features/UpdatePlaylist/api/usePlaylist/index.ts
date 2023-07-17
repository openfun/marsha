import { Playlist, fetchOne } from 'lib-components';
import { UseQueryOptions, useQuery } from 'react-query';

export const usePlaylist = (
  id: string,
  queryConfig?: UseQueryOptions<Playlist, 'playlists', Playlist, string[]>,
) => {
  const keys = ['playlists', id];
  return useQuery<Playlist, 'playlists', Playlist, string[]>(
    keys,
    fetchOne,
    queryConfig,
  );
};

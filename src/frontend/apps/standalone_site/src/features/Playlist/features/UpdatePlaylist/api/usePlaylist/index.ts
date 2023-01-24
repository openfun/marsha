import { fetchOne, Playlist } from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

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

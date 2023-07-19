import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { APIList, FetchListQueryKey, fetchList } from 'lib-components';

import { PlaylistAccess } from '../../types/playlistAccess';

type PlaylistAccessResponse = APIList<PlaylistAccess>;
type UsePlaylistAccessParams = {
  playlist_id: string;
  limit: string;
  offset: string;
};

export const usePlaylistAccess = (
  params: UsePlaylistAccessParams,
  queryConfig?: UseQueryOptions<
    PlaylistAccessResponse,
    'playlist-accesses',
    PlaylistAccessResponse,
    FetchListQueryKey
  >,
) => {
  const keys: FetchListQueryKey = ['playlist-accesses', params];
  return useQuery<
    PlaylistAccessResponse,
    'playlist-accesses',
    PlaylistAccessResponse,
    FetchListQueryKey
  >({ queryKey: keys, queryFn: fetchList, ...queryConfig });
};

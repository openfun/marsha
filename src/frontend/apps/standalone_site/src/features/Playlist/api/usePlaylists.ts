import {
  APIList,
  fetchList,
  FetchListQueryKey,
  Playlist,
} from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

export enum PlaylistOrderType {
  BY_CREATED_ON = 'created_on',
  BY_CREATED_ON_REVERSED = '-created_on',
  BY_TITLE = 'title',
  BY_TITLE_REVERSED = '-title',
}

type PlaylistsResponse = APIList<Playlist>;
type UsePlaylistsParams = {
  limit: string;
  offset: string;
  ordering?: PlaylistOrderType;
};

export const usePlaylists = (
  params: UsePlaylistsParams,
  queryConfig?: UseQueryOptions<
    PlaylistsResponse,
    'playlists',
    PlaylistsResponse,
    FetchListQueryKey
  >,
) => {
  const keys: FetchListQueryKey = ['playlists', params];
  return useQuery<
    PlaylistsResponse,
    'playlists',
    PlaylistsResponse,
    FetchListQueryKey
  >(keys, fetchList, queryConfig);
};

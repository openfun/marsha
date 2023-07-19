import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import {
  APIList,
  FetchListQueryKey,
  FetchResponseError,
  Playlist,
  fetchList,
} from 'lib-components';

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
  can_edit?: 'true' | 'false'; // boolean as string
};

export const usePlaylists = (
  params: UsePlaylistsParams,
  queryConfig?: UseQueryOptions<
    PlaylistsResponse,
    FetchResponseError<PlaylistsResponse>,
    PlaylistsResponse,
    FetchListQueryKey
  >,
) => {
  const keys: FetchListQueryKey = ['playlists', params];
  return useQuery<
    PlaylistsResponse,
    FetchResponseError<PlaylistsResponse>,
    PlaylistsResponse,
    FetchListQueryKey
  >({ queryKey: keys, queryFn: fetchList, ...queryConfig });
};

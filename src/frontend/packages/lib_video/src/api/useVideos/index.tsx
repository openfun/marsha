import { Maybe } from 'lib-common';
import {
  APIList,
  fetchList,
  FetchListQueryKey,
  fetchOne,
  Video,
} from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

export const useVideo = (
  videoId: string,
  queryConfig?: UseQueryOptions<Video, 'videos', Video>,
) => {
  const key = ['videos', videoId];
  return useQuery<Video, 'videos'>(key, fetchOne, queryConfig);
};

type VideosResponse = APIList<Video>;
type UseVideosParams = Maybe<{ organization?: string; playlist?: string }>;
export const useVideos = (
  params: UseVideosParams,
  queryConfig?: UseQueryOptions<
    VideosResponse,
    'videos',
    VideosResponse,
    FetchListQueryKey
  >,
) => {
  const key: FetchListQueryKey = ['videos', params];
  return useQuery<VideosResponse, 'videos', VideosResponse, FetchListQueryKey>(
    key,
    fetchList,
    queryConfig,
  );
};

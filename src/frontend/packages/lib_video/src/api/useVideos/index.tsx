import { Maybe } from 'lib-common';
import {
  APIList,
  fetchList,
  FetchListQueryKey,
  fetchOne,
  FetchResponseError,
  Video,
} from 'lib-components';
import { useQuery, UseQueryOptions } from 'react-query';

type VideoResponseError = FetchResponseError<Video>;
export const useVideo = (
  videoId: string,
  queryConfig?: UseQueryOptions<Video, VideoResponseError, Video>,
) => {
  const key = ['videos', videoId];
  return useQuery<Video, VideoResponseError>(key, fetchOne, queryConfig);
};

export enum VideosOrderType {
  BY_CREATED_ON = 'created_on',
  BY_CREATED_ON_REVERSED = '-created_on',
  BY_TITLE = 'title',
  BY_TITLE_REVERSED = '-title',
}

type VideosResponse = APIList<Video>;
type UseVideosParams = Maybe<{
  organization?: string;
  playlist?: string;
  limit?: Maybe<string>;
  offset?: Maybe<string>;
  ordering?: VideosOrderType;
}>;
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

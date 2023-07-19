import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { Maybe } from 'lib-common';
import {
  APIList,
  FetchListQueryKey,
  FetchResponseError,
  Video,
  fetchList,
  fetchOne,
} from 'lib-components';

type VideoResponseError = FetchResponseError<Video>;
export const useVideo = (
  videoId: string,
  queryConfig?: UseQueryOptions<Video, VideoResponseError, Video>,
) => {
  const key = ['videos', videoId];
  return useQuery<Video, VideoResponseError>({
    queryKey: key,
    queryFn: fetchOne,
    ...queryConfig,
  });
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
  limit?: string;
  offset?: string;
  is_live?: 'true' | 'false';
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
  return useQuery<VideosResponse, 'videos', VideosResponse, FetchListQueryKey>({
    queryKey: key,
    queryFn: fetchList,
    ...queryConfig,
  });
};

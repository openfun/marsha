import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from 'react-query';

import { APIList } from '../../types/api';
import { Playlist, Thumbnail, TimedText, Video } from '../../types/tracks';
import { Organization } from '../../types/Organization';
import { createOne } from './createOne';
import { fetchList } from './fetchList';
import { fetchOne } from './fetchOne';

export const useOrganization = (
  organizationId: string,
  queryConfig?: UseQueryOptions<Organization, 'organizations', Organization>,
) => {
  const key = ['organizations', organizationId];
  return useQuery<Organization, 'organizations'>(key, fetchOne, queryConfig);
};

export const usePlaylist = (
  playlistId: string,
  queryConfig?: UseQueryOptions<Playlist, 'playlists', Playlist>,
) => {
  const key = ['playlists', playlistId];
  return useQuery<Playlist, 'playlists'>(key, fetchOne, queryConfig);
};

type PlaylistsResponse = APIList<Playlist>;
type UsePlaylistsParams = { organization: string };
export const usePlaylists = (
  params: UsePlaylistsParams,
  queryConfig?: UseQueryOptions<
    PlaylistsResponse,
    'playlists',
    PlaylistsResponse
  >,
) => {
  const key = ['playlists', params];
  return useQuery<PlaylistsResponse, 'playlists'>(key, fetchList, queryConfig);
};

export const useThumbnail = (
  thumbnailId: string,
  queryConfig?: UseQueryOptions<Thumbnail, 'thumbnails', Thumbnail>,
) => {
  const key = ['thumbnails', thumbnailId];
  return useQuery<Thumbnail, 'thumbnails'>(key, fetchOne, queryConfig);
};

type TimedTextTracksResponse = APIList<TimedText>;
type UseTimedTextTracksParams = { video: string };
export const useTimedTextTracks = (
  params: UseTimedTextTracksParams,
  queryConfig?: UseQueryOptions<
    TimedTextTracksResponse,
    'timedtexttracks',
    TimedTextTracksResponse
  >,
) => {
  const key = ['timedtexttracks', params];
  return useQuery<TimedTextTracksResponse, 'timedtexttracks'>(
    key,
    fetchList,
    queryConfig,
  );
};

export const useVideo = (
  videoId: string,
  queryConfig?: UseQueryOptions<Video, 'videos', Video>,
) => {
  const key = ['videos', videoId];
  return useQuery<Video, 'videos'>(key, fetchOne, queryConfig);
};

type UseCreateVideoData = { lti_id: string; playlist: string; title: string };
type UseCreateVideoError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreateVideoData]?: string[] }[];
    };
type UseCreateVideoOptions = UseMutationOptions<
  Video,
  UseCreateVideoError,
  UseCreateVideoData
>;
export const useCreateVideo = (options?: UseCreateVideoOptions) => {
  const queryClient = useQueryClient();
  return useMutation<Video, UseCreateVideoError, UseCreateVideoData>(
    (newVideo) => createOne({ name: 'videos', object: newVideo }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('videos');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

type VideosResponse = APIList<Video>;
type UseVideosParams = {} | { organization: string };
export const useVideos = (
  params: UseVideosParams,
  queryConfig?: UseQueryOptions<VideosResponse, 'videos', VideosResponse>,
) => {
  const key = ['videos', params];
  return useQuery<VideosResponse, 'videos'>(key, fetchList, queryConfig);
};

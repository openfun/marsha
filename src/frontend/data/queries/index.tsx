import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from 'react-query';

import { useVideo as useVideoStore } from 'data/stores/useVideo';
import { APIList } from 'types/api';
import { Playlist, Thumbnail, TimedText, Video } from 'types/tracks';
import { Organization } from 'types/Organization';

import { actionOne } from './actionOne';
import { createOne } from './createOne';
import { fetchList } from './fetchList';
import { fetchOne } from './fetchOne';
import { updateOne } from './updateOne';

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

type UseUpdatePlaylistData = Partial<
  Omit<Playlist, 'portable_to'> & { portable_to: string[] }
>;
type UseUpdatePlaylistError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdatePlaylistData]?: string[] }[];
    };
type UseUpdatePlaylistOptions = UseMutationOptions<
  Playlist,
  UseUpdatePlaylistError,
  UseUpdatePlaylistData
>;
export const useUpdatePlaylist = (
  id: string,
  options?: UseUpdatePlaylistOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<Playlist, UseUpdatePlaylistError, UseUpdatePlaylistData>(
    (updatedPlaylist) =>
      updateOne({ name: 'playlists', id, object: updatedPlaylist }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('playlists');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('playlists');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
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

type UseCreateVideoData = { playlist: string; title: string };
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

type UseUpdateVideoData = Partial<Video>;
type UseUpdateVideoError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdateVideoData]?: string[] }[];
    };
type UseUpdateVideoOptions = UseMutationOptions<
  Video,
  UseUpdateVideoError,
  UseUpdateVideoData
>;
export const useUpdateVideo = (id: string, options?: UseUpdateVideoOptions) => {
  const queryClient = useQueryClient();
  return useMutation<Video, UseUpdateVideoError, UseUpdateVideoData>(
    (updatedVideo) => updateOne({ name: 'videos', id, object: updatedVideo }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('videos');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('videos');
        if (options?.onError) {
          options.onError(error, variables, context);
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

type usePairingVideoError = { code: 'exception' };
type usePairingVideoResponse = {
  secret: string;
  expires_in: number;
};
type usePairingVideoOptions = UseMutationOptions<
  usePairingVideoResponse,
  usePairingVideoError
>;
export const usePairingVideo = (
  id: string,
  options?: usePairingVideoOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<usePairingVideoResponse, usePairingVideoError>(
    () =>
      actionOne({
        name: 'videos',
        id,
        action: 'pairing-secret',
        method: 'GET',
      }),
    {
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('videos');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('videos');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

export const useStartLiveRecording = (id: string, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation<Video>(
    () =>
      actionOne({
        name: 'videos',
        id,
        action: 'start-recording',
        method: 'PATCH',
      }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('videos');
        useVideoStore.getState().addResource(data);
      },
      onError: () => {
        queryClient.invalidateQueries('videos');
        onError();
      },
    },
  );
};

export const useStopLiveRecording = (id: string, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation<Video>(
    () =>
      actionOne({
        name: 'videos',
        id,
        action: 'stop-recording',
        method: 'PATCH',
      }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('videos');
        useVideoStore.getState().addResource(data);
      },
      onError: () => {
        queryClient.invalidateQueries('videos');
        onError();
      },
    },
  );
};

import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Maybe } from 'lib-common';
import {
  APIList,
  Document,
  FetchListQueryKey,
  Organization,
  Playlist,
  PortabilityRequest,
  Thumbnail,
  Video,
  actionOne,
  createOne,
  fetchList,
  fetchOne,
  updateOne,
  useVideo as useVideoStore,
} from 'lib-components';

export const useOrganization = (
  organizationId: string,
  queryConfig?: UseQueryOptions<Organization, 'organizations', Organization>,
) => {
  const key = ['organizations', organizationId];
  return useQuery<Organization, 'organizations'>({
    queryKey: key,
    queryFn: fetchOne,
    ...queryConfig,
  });
};

export const usePlaylist = (
  playlistId: string,
  queryConfig?: UseQueryOptions<Playlist, 'playlists', Playlist>,
) => {
  const key = ['playlists', playlistId];
  return useQuery<Playlist, 'playlists'>({
    queryKey: key,
    queryFn: fetchOne,
    ...queryConfig,
  });
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
  return useMutation<Playlist, UseUpdatePlaylistError, UseUpdatePlaylistData>({
    mutationFn: (updatedPlaylist) =>
      updateOne({ name: 'playlists', id, object: updatedPlaylist }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['playlists']);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries(['playlists']);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

type usePlaylistIsClaimedResponse = { is_claimed: boolean };
export const usePlaylistIsClaimed = (
  playlistId: string,
  queryConfig?: UseQueryOptions<
    usePlaylistIsClaimedResponse,
    'playlists',
    usePlaylistIsClaimedResponse
  >,
) => {
  const key = ['playlists', playlistId, 'is-claimed'];
  return useQuery<usePlaylistIsClaimedResponse, 'playlists'>({
    queryKey: key,
    queryFn: fetchOne,
    ...queryConfig,
  });
};

type PlaylistsResponse = APIList<Playlist>;
type UsePlaylistsParams = { organization: Maybe<string> };
export const usePlaylists = (
  params: UsePlaylistsParams,
  queryConfig?: UseQueryOptions<
    PlaylistsResponse,
    'playlists',
    PlaylistsResponse,
    FetchListQueryKey
  >,
) => {
  const key: FetchListQueryKey = ['playlists', params];
  return useQuery<
    PlaylistsResponse,
    'playlists',
    PlaylistsResponse,
    FetchListQueryKey
  >({ queryKey: key, queryFn: fetchList, ...queryConfig });
};

export const useThumbnail = (
  thumbnailId: string,
  videoId: string,
  queryConfig?: UseQueryOptions<Thumbnail, 'thumbnails', Thumbnail>,
) => {
  const key = [`videos/${videoId}/thumbnails`, thumbnailId];
  return useQuery<Thumbnail, 'thumbnails'>({
    queryKey: key,
    queryFn: fetchOne,
    ...queryConfig,
  });
};

export const useStartLiveRecording = (id: string, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation<Video>({
    mutationFn: () =>
      actionOne({
        name: 'videos',
        id,
        action: 'start-recording',
        method: 'PATCH',
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['videos']);
      useVideoStore.getState().addResource(data);
    },
    onError: () => {
      queryClient.invalidateQueries(['videos']);
      onError();
    },
  });
};

export const useStopLiveRecording = (id: string, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation<Video>({
    mutationFn: () =>
      actionOne({
        name: 'videos',
        id,
        action: 'stop-recording',
        method: 'PATCH',
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['videos']);
      useVideoStore.getState().addResource(data);
    },
    onError: () => {
      queryClient.invalidateQueries(['videos']);
      onError();
    },
  });
};

type UseCreateDocumentData = {
  playlist: string;
  title: string;
  description?: string;
  lti_id?: string;
};
type UseCreateDocumentError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreateDocumentData]?: string[] }[];
    };
type UseCreateDocumentOptions = UseMutationOptions<
  Document,
  UseCreateDocumentError,
  UseCreateDocumentData
>;
export const useCreateDocument = (options?: UseCreateDocumentOptions) => {
  const queryClient = useQueryClient();
  return useMutation<Document, UseCreateDocumentError, UseCreateDocumentData>({
    mutationFn: (newDocument) =>
      createOne({ name: 'documents', object: newDocument }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['documents']);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

type UseCreatePortabilityRequestData = {
  for_playlist: string;
  from_playlist: string;
  // for now, only allow request creation from LTI context
  from_lti_consumer_site: string; // mandatory in LTI
  from_lti_user_id: string; // mandatory in LTI
};
type UseCreatePortabilityRequestError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreatePortabilityRequestData]?: string[] }[];
    };
type UseCreatePortabilityRequestOptions = UseMutationOptions<
  PortabilityRequest,
  UseCreatePortabilityRequestError,
  UseCreatePortabilityRequestData
>;
export const useCreatePortabilityRequest = (
  options?: UseCreatePortabilityRequestOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    PortabilityRequest,
    UseCreatePortabilityRequestError,
    UseCreatePortabilityRequestData
  >({
    mutationFn: (newPortabilityRequest) =>
      createOne({
        name: 'portability-requests',
        object: newPortabilityRequest,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['portability-requests']);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

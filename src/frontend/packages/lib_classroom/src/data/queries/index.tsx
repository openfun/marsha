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
  Classroom,
  ClassroomDocument,
  ClassroomLite,
  ClassroomModelName,
  ClassroomRecording,
  CreateClassroomActionRequest,
  CreateClassroomActionResponse,
  EndClassroomActionRequest,
  EndClassroomActionResponse,
  FetchListQueryKey,
  FetchResponseError,
  JoinClassroomActionRequest,
  JoinClassroomActionResponse,
  actionOne,
  bulkDelete,
  createOne,
  deleteOne,
  fetchList,
  fetchOne,
  metadata,
  updateOne,
} from 'lib-components';

import { ClassroomDocumentMetadata } from '@lib-classroom/types/ClassroomAppData';

type ClassroomsResponse = APIList<ClassroomLite>;
type UseClassroomsParams = {
  organization?: string;
  limit?: string;
  offset?: string;
  playlist?: string;
};
export const useClassrooms = (
  params: UseClassroomsParams,
  queryConfig?: UseQueryOptions<
    ClassroomsResponse,
    'classrooms',
    ClassroomsResponse,
    FetchListQueryKey
  >,
) => {
  const key: FetchListQueryKey = ['classrooms', params];
  return useQuery<
    ClassroomsResponse,
    'classrooms',
    ClassroomsResponse,
    FetchListQueryKey
  >({ queryKey: key, queryFn: fetchList, ...queryConfig });
};

interface ClassroomsSelectResponse {
  new_url: string;
  classrooms: Classroom[];
}
export const useSelectClassroom = (
  queryConfig?: UseQueryOptions<
    ClassroomsSelectResponse,
    'classrooms',
    ClassroomsSelectResponse
  >,
) => {
  const key = ['classrooms', 'lti-select'];
  return useQuery<ClassroomsSelectResponse, 'classrooms'>({
    queryKey: key,
    queryFn: fetchOne,
    ...queryConfig,
  });
};

type ErrorResponseFetchOneClassroom = FetchResponseError<{ detail: string }>;
export const useClassroom = (
  classroomId: string,
  queryConfig?: UseQueryOptions<
    Classroom,
    ErrorResponseFetchOneClassroom,
    Classroom
  >,
) => {
  const key = ['classrooms', classroomId];
  return useQuery<Classroom, ErrorResponseFetchOneClassroom>({
    queryKey: key,
    queryFn: fetchOne,
    ...queryConfig,
  });
};

type UseCreateClassroomData = {
  playlist: string;
  title: string;
  description?: string;
  lti_id?: string;
};
type UseCreateClassroomError = FetchResponseError<UseCreateClassroomData>;
type UseCreateClassroomOptions = UseMutationOptions<
  Classroom,
  UseCreateClassroomError,
  UseCreateClassroomData
>;
export const useCreateClassroom = (options?: UseCreateClassroomOptions) => {
  const queryClient = useQueryClient();
  return useMutation<
    Classroom,
    UseCreateClassroomError,
    UseCreateClassroomData
  >({
    mutationFn: (newClassroom) =>
      createOne({ name: 'classrooms', object: newClassroom }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['classrooms']);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

type UseUpdateClassroomData = Partial<
  Omit<Classroom, 'portable_to'> & { portable_to: string[] }
>;
type UseUpdateClassroomError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdateClassroomData]?: string[] }[];
    };
type UseUpdateClassroomOptions = UseMutationOptions<
  Classroom,
  UseUpdateClassroomError,
  UseUpdateClassroomData
>;
export const useUpdateClassroom = (
  id: string,
  options?: UseUpdateClassroomOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Classroom,
    UseUpdateClassroomError,
    UseUpdateClassroomData
  >({
    mutationFn: (updatedClassroom) =>
      updateOne({ name: 'classrooms', id, object: updatedClassroom }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['classrooms']);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries(['classrooms']);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

type UseDeleteClassroomData = string;
type UseDeleteClassroomError = FetchResponseError<UseDeleteClassroomData>;
type UseDeleteClassroomOptions = UseMutationOptions<
  Maybe<Classroom>,
  UseDeleteClassroomError,
  UseDeleteClassroomData
>;
export const useDeleteClassroom = (options?: UseDeleteClassroomOptions) => {
  const queryClient = useQueryClient();
  return useMutation<
    Maybe<Classroom>,
    UseDeleteClassroomError,
    UseDeleteClassroomData
  >({
    mutationFn: (classroomId) =>
      deleteOne({
        name: 'classrooms',
        id: classroomId,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['classrooms']);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries(['classrooms']);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

type UseDeleteClassroomRecordingData = {
  classroomId: string;
  classroomRecordingId: string;
};
type UseDeleteClassroomRecordingError =
  FetchResponseError<UseDeleteClassroomRecordingData>;
type UseDeleteClassroomRecordingOptions = UseMutationOptions<
  Maybe<ClassroomRecording>,
  UseDeleteClassroomRecordingError,
  UseDeleteClassroomRecordingData
>;
export const useDeleteClassroomRecording = (
  options?: UseDeleteClassroomRecordingOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Maybe<ClassroomRecording>,
    UseDeleteClassroomRecordingError,
    UseDeleteClassroomRecordingData
  >({
    mutationFn: ({ classroomId, classroomRecordingId }) =>
      deleteOne({
        name: `classrooms/${classroomId}/recordings`,
        id: classroomRecordingId,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries([`classrooms`]);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries([`classrooms`]);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

type ClassroomDocumentsResponse = APIList<ClassroomDocument>;
type UseClassroomDocumentParams = Record<string, never>;
export const useClassroomDocuments = (
  classroomId: string,
  params: UseClassroomDocumentParams,
  queryConfig?: UseQueryOptions<
    ClassroomDocumentsResponse,
    ClassroomModelName.CLASSROOM_DOCUMENTS,
    ClassroomDocumentsResponse,
    FetchListQueryKey
  >,
) => {
  const key: FetchListQueryKey = [
    `${ClassroomModelName.CLASSROOMS}/${classroomId}/${ClassroomModelName.CLASSROOM_DOCUMENTS}`,
    params,
  ];
  return useQuery<
    ClassroomDocumentsResponse,
    ClassroomModelName.CLASSROOM_DOCUMENTS,
    ClassroomDocumentsResponse,
    FetchListQueryKey
  >({ queryKey: key, queryFn: fetchList, ...queryConfig });
};

type UseUpdateClassroomDocumentData = Partial<ClassroomDocument>;
type UseUpdateClassroomDocumentError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdateClassroomDocumentData]?: string[] }[];
    };
type UseUpdateClassroomDocumentOptions = UseMutationOptions<
  ClassroomDocument,
  UseUpdateClassroomDocumentError,
  UseUpdateClassroomDocumentData
>;
export const useUpdateClassroomDocument = (
  classroomId: Classroom['id'],
  id: ClassroomDocument['id'],
  options?: UseUpdateClassroomDocumentOptions,
) => {
  const queryClient = useQueryClient();
  const urlPath = `${ClassroomModelName.CLASSROOMS}/${classroomId}/${ClassroomModelName.CLASSROOM_DOCUMENTS}`;
  return useMutation<
    ClassroomDocument,
    UseUpdateClassroomDocumentError,
    UseUpdateClassroomDocumentData
  >({
    mutationFn: (updatedClassroomDocument) =>
      updateOne({
        name: urlPath,
        id,
        object: updatedClassroomDocument,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries([urlPath]);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries([urlPath]);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

type UseDeleteClassroomDocumentData = {
  classroomId: string;
  classroomDocumentId: string;
};
type UseDeleteClassroomDocumentError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseDeleteClassroomDocumentData]?: string[] }[];
    };
type UseDeleteClassroomDocumentOptions = UseMutationOptions<
  Maybe<ClassroomDocument>,
  UseDeleteClassroomDocumentError,
  UseDeleteClassroomDocumentData
>;
export const useDeleteClassroomDocument = (
  options?: UseDeleteClassroomDocumentOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Maybe<ClassroomDocument>,
    UseDeleteClassroomDocumentError,
    UseDeleteClassroomDocumentData
  >({
    mutationFn: ({ classroomId, classroomDocumentId }) =>
      deleteOne({
        name: `${ClassroomModelName.CLASSROOMS}/${classroomId}/${ClassroomModelName.CLASSROOM_DOCUMENTS}`,
        id: classroomDocumentId,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries([
        `${ClassroomModelName.CLASSROOMS}/${variables.classroomId}/${ClassroomModelName.CLASSROOM_DOCUMENTS}`,
      ]);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries([
        `${ClassroomModelName.CLASSROOMS}/${variables.classroomId}/${ClassroomModelName.CLASSROOM_DOCUMENTS}`,
      ]);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

type MutationClassroomData<ClassroomRequest> = Partial<ClassroomRequest>;
type MutationClassroomError<ClassroomRequest> =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: {
        [key in keyof MutationClassroomData<ClassroomRequest>]?: string[];
      }[];
    };
type MutationClassroomOptions<ClassroomResponse, ClassroomRequest> =
  UseMutationOptions<
    ClassroomResponse,
    MutationClassroomError<ClassroomRequest>,
    MutationClassroomData<ClassroomRequest>
  >;
enum MutationClassroomAction {
  CREATE = 'create',
  END = 'end',
  JOIN = 'join',
}
const classroomActionMutation =
  <ClassroomResponse, ClassroomRequest>(action: MutationClassroomAction) =>
  (
    id: string,
    options?: MutationClassroomOptions<ClassroomResponse, ClassroomRequest>,
  ) => {
    const queryClient = useQueryClient();
    return useMutation<
      ClassroomResponse,
      MutationClassroomError<ClassroomRequest>,
      MutationClassroomData<ClassroomRequest>
    >({
      mutationFn: (object) =>
        actionOne({
          name: 'classrooms',
          id,
          action,
          object,
        }),
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(['classrooms']);
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries(['classrooms']);
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    });
  };

export const useCreateClassroomAction = classroomActionMutation<
  CreateClassroomActionResponse,
  CreateClassroomActionRequest
>(MutationClassroomAction.CREATE);
export const useJoinClassroomAction = classroomActionMutation<
  JoinClassroomActionResponse,
  JoinClassroomActionRequest
>(MutationClassroomAction.JOIN);
export const useEndClassroomAction = classroomActionMutation<
  EndClassroomActionResponse,
  EndClassroomActionRequest
>(MutationClassroomAction.END);

export const useClassroomDocumentMetadata = (
  classroomId: string,
  locale: string,
  queryConfig?: UseQueryOptions<
    ClassroomDocumentMetadata,
    'classroomdocuments',
    ClassroomDocumentMetadata,
    string[]
  >,
) => {
  const key = [
    `${ClassroomModelName.CLASSROOMS}/${classroomId}/${ClassroomModelName.CLASSROOM_DOCUMENTS}`,
    locale,
  ];
  return useQuery<
    ClassroomDocumentMetadata,
    'classroomdocuments',
    ClassroomDocumentMetadata,
    string[]
  >({
    queryKey: key,
    queryFn: metadata,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
    staleTime: Infinity,
    ...queryConfig,
  });
};

type UseDeleteClassroomsData = { ids: string[] };
type UseDeleteClassroomsError = FetchResponseError<UseDeleteClassroomsData>;
type UseDeleteClassroomsOptions = UseMutationOptions<
  void,
  UseDeleteClassroomsError,
  UseDeleteClassroomsData
>;
export const useDeleteClassrooms = (options?: UseDeleteClassroomsOptions) => {
  const queryClient = useQueryClient();
  return useMutation<void, UseDeleteClassroomsError, UseDeleteClassroomsData>({
    mutationFn: (classroomIds) =>
      bulkDelete({
        name: 'classrooms',
        objects: classroomIds,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['classrooms']);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      queryClient.invalidateQueries(['classrooms']);
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};

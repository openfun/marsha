import { Maybe } from 'lib-common';
import {
  APIList,
  actionOne,
  createOne,
  fetchList,
  FetchListQueryKey,
  fetchOne,
  updateOne,
  EndClassroomActionRequest,
  EndClassroomActionResponse,
  JoinClassroomActionRequest,
  JoinClassroomActionResponse,
  Classroom,
  ClassroomLite,
  CreateClassroomActionRequest,
  CreateClassroomActionResponse,
  ClassroomDocument,
  ClassroomModelName,
  metadata,
  FetchResponseError,
  deleteOne,
} from 'lib-components';
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from 'react-query';

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
  >(key, fetchList, queryConfig);
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
  return useQuery<ClassroomsSelectResponse, 'classrooms'>(
    key,
    fetchOne,
    queryConfig,
  );
};

export const useClassroom = (
  classroomId: string,
  queryConfig?: UseQueryOptions<Classroom, 'classrooms', Classroom>,
) => {
  const key = ['classrooms', classroomId];
  return useQuery<Classroom, 'classrooms'>(key, fetchOne, queryConfig);
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
  >((newClassroom) => createOne({ name: 'classrooms', object: newClassroom }), {
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries('classrooms');
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
  >(
    (updatedClassroom) =>
      updateOne({ name: 'classrooms', id, object: updatedClassroom }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('classrooms');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('classrooms');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
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
  >(key, fetchList, queryConfig);
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
  id: string,
  options?: UseUpdateClassroomDocumentOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ClassroomDocument,
    UseUpdateClassroomDocumentError,
    UseUpdateClassroomDocumentData
  >(
    (updatedClassroomDocument) =>
      updateOne({
        name: 'classroomdocuments',
        id,
        object: updatedClassroomDocument,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('classroomdocuments');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('classroomdocuments');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

type UseDeleteClassroomDocumentData = string;
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
  >(
    (classroomDocumentId) =>
      deleteOne({
        name: 'classroomdocuments',
        id: classroomDocumentId,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('classroomdocuments');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('classroomdocuments');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
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
    >(
      (object) =>
        actionOne({
          name: 'classrooms',
          id,
          action,
          object,
        }),
      {
        ...options,
        onSuccess: (data, variables, context) => {
          queryClient.invalidateQueries('classrooms');
          if (options?.onSuccess) {
            options.onSuccess(data, variables, context);
          }
        },
        onError: (error, variables, context) => {
          queryClient.invalidateQueries('classrooms');
          if (options?.onError) {
            options.onError(error, variables, context);
          }
        },
      },
    );
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
  locale: string,
  queryConfig?: UseQueryOptions<
    ClassroomDocumentMetadata,
    'classroomdocuments',
    ClassroomDocumentMetadata,
    string[]
  >,
) => {
  const key = ['classroomdocuments', locale];
  return useQuery<
    ClassroomDocumentMetadata,
    'classroomdocuments',
    ClassroomDocumentMetadata,
    string[]
  >(key, metadata, {
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
    staleTime: Infinity,
    ...queryConfig,
  });
};

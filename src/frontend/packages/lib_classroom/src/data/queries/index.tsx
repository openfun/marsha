/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-floating-promises */
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
} from 'lib-components';
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from 'react-query';

type ClassroomsResponse = APIList<ClassroomLite>;
type UseClassroomsParams = {
  organization?: Maybe<string>;
  limit?: Maybe<string>;
  offset?: Maybe<string>;
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
type UseCreateClassroomError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreateClassroomData]?: string[] }[];
    };
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
type UseClassroomDocumentParams = {};
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
  id?: string,
  options?: UseUpdateClassroomDocumentOptions,
) => {
  if (!id) {
    return undefined;
  }
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

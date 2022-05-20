import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from 'react-query';

import { APIList } from 'types/api';
import { fetchList } from 'data/queries/fetchList';
import { fetchOne } from 'data/queries/fetchOne';
import { updateOne } from 'data/queries/updateOne';
import { actionOne } from 'data/queries/actionOne';

import {
  EndMeetingActionRequest,
  EndMeetingActionResponse,
  JoinMeetingActionRequest,
  JoinMeetingActionResponse,
  Meeting,
  CreateMeetingActionRequest,
  CreateMeetingActionResponse,
} from 'apps/bbb/types/models';

type MeetingsResponse = APIList<Meeting>;
type UseMeetingsParams = {} | { organization: string };
export const useMeetings = (
  params: UseMeetingsParams,
  queryConfig?: UseQueryOptions<MeetingsResponse, 'meetings', MeetingsResponse>,
) => {
  const key = ['meetings', params];
  return useQuery<MeetingsResponse, 'meetings'>(key, fetchList, queryConfig);
};

interface MeetingsSelectResponse {
  new_url: string;
  meetings: Meeting[];
}
export const useSelectMeeting = (
  queryConfig?: UseQueryOptions<
    MeetingsSelectResponse,
    'meetings',
    MeetingsSelectResponse
  >,
) => {
  const key = ['meetings', 'lti-select'];
  return useQuery<MeetingsSelectResponse, 'meetings'>(
    key,
    fetchOne,
    queryConfig,
  );
};

export const useMeeting = (
  meetingId: string,
  queryConfig?: UseQueryOptions<Meeting, 'meetings', Meeting>,
) => {
  const key = ['meetings', meetingId];
  return useQuery<Meeting, 'meetings'>(key, fetchOne, queryConfig);
};

type UseUpdateMeetingData = Partial<
  Omit<Meeting, 'portable_to'> & { portable_to: string[] }
>;
type UseUpdateMeetingError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdateMeetingData]?: string[] }[];
    };
type UseUpdateMeetingOptions = UseMutationOptions<
  Meeting,
  UseUpdateMeetingError,
  UseUpdateMeetingData
>;
export const useUpdateMeeting = (
  id: string,
  options?: UseUpdateMeetingOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<Meeting, UseUpdateMeetingError, UseUpdateMeetingData>(
    (updatedMeeting) =>
      updateOne({ name: 'meetings', id, object: updatedMeeting }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('meetings');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('meetings');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

type MutationMeetingData<MeetingRequest> = Partial<MeetingRequest>;
type MutationMeetingError<MeetingRequest> =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: {
        [key in keyof MutationMeetingData<MeetingRequest>]?: string[];
      }[];
    };
type MutationMeetingOptions<MeetingResponse, MeetingRequest> =
  UseMutationOptions<
    MeetingResponse,
    MutationMeetingError<MeetingRequest>,
    MutationMeetingData<MeetingRequest>
  >;
enum MutationMeetingAction {
  CREATE = 'create',
  END = 'end',
  JOIN = 'join',
}
const meetingActionMutation =
  <MeetingResponse, MeetingRequest>(action: MutationMeetingAction) =>
  (
    id: string,
    options?: MutationMeetingOptions<MeetingResponse, MeetingRequest>,
  ) => {
    const queryClient = useQueryClient();
    return useMutation<
      MeetingResponse,
      MutationMeetingError<MeetingRequest>,
      MutationMeetingData<MeetingRequest>
    >(
      (object) =>
        actionOne({
          name: 'meetings',
          id,
          action,
          object,
        }),
      {
        ...options,
        onSuccess: (data, variables, context) => {
          queryClient.invalidateQueries('meetings');
          if (options?.onSuccess) {
            options.onSuccess(data, variables, context);
          }
        },
        onError: (error, variables, context) => {
          queryClient.invalidateQueries('meetings');
          if (options?.onError) {
            options.onError(error, variables, context);
          }
        },
      },
    );
  };

export const useCreateMeetingAction = meetingActionMutation<
  CreateMeetingActionResponse,
  CreateMeetingActionRequest
>(MutationMeetingAction.CREATE);
export const useJoinMeetingAction = meetingActionMutation<
  JoinMeetingActionResponse,
  JoinMeetingActionRequest
>(MutationMeetingAction.JOIN);
export const useEndMeetingAction = meetingActionMutation<
  EndMeetingActionResponse,
  EndMeetingActionRequest
>(MutationMeetingAction.END);

import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { FetchResponseError, createOne } from 'lib-components';

type UseCreateLtiUserAssociationData = {
  association_jwt?: string;
  lti_consumer_site_id?: string;
  lti_user_id?: string;
};
type UseCreateLtiUserAssociationError =
  FetchResponseError<UseCreateLtiUserAssociationData>;
type UseCreateLtiUserAssociationOptions = UseMutationOptions<
  null, // TData, the mutation result : nothing
  UseCreateLtiUserAssociationError,
  UseCreateLtiUserAssociationData
>;
export const useCreateLtiUserAssociation = (
  options?: UseCreateLtiUserAssociationOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    null, // TData, the mutation result : nothing
    UseCreateLtiUserAssociationError,
    UseCreateLtiUserAssociationData
  >({
    mutationFn: (newLtiUserAssociation) =>
      createOne({
        name: 'lti-user-associations',
        object: newLtiUserAssociation,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['lti-user-associations']);
      // Also refresh portability requests because requesting user may have been updated
      queryClient.invalidateQueries(['portability-requests']);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

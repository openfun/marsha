import { createOne } from 'lib-components';
import { UseMutationOptions, useMutation, useQueryClient } from 'react-query';

type UseCreateLtiUserAssociationData = {
  association_jwt: string;
};
type UseCreateLtiUserAssociationError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreateLtiUserAssociationData]?: string[] }[];
    };
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
  >(
    (newLtiUserAssociation) =>
      createOne({
        name: 'lti-user-associations',
        object: newLtiUserAssociation,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('lti-user-associations');
        // Also refresh portability requests because requesting user may have been updated
        queryClient.invalidateQueries('portability-requests');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

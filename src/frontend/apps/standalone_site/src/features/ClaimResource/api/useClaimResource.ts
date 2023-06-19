import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { FetchResponseError, actionOne } from 'lib-components';

type UseClaimResourceData = {
  playlist_id: string;
};
type UseClaimResourceError = FetchResponseError<UseClaimResourceData>;

export const useClaimResource = (
  id: string,
  options?: UseMutationOptions<UseClaimResourceError, UseClaimResourceData>,
) => {
  const queryClient = useQueryClient();
  return useMutation<UseClaimResourceError, UseClaimResourceData>({
    mutationFn: () =>
      actionOne({
        name: 'playlists',
        id: id,
        action: 'claim',
        method: 'POST',
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['playlists']);
      options?.onSuccess?.(data, variables, context);
    },
  });
};

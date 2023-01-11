import { actionOne } from 'lib-components';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

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

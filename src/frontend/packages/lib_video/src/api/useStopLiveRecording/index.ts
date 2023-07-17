import { Video, actionOne, useVideo } from 'lib-components';
import { useMutation, useQueryClient } from 'react-query';

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
        useVideo.getState().addResource(data);
      },
      onError: () => {
        queryClient.invalidateQueries('videos');
        onError();
      },
    },
  );
};

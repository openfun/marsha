import {
  RetentionDate as CommonRetentionDate,
  Video,
  debounce,
} from 'lib-components';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks';

const messages = defineMessages({
  ressource: {
    defaultMessage: 'video',
    description:
      'Type of ressource displayed in the info retention date widget.',
    id: 'component.VideoRetentionDate.ressource',
  },
  updateVideoSuccess: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.VideoRetentionDate.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed!',
    description: 'Message displayed when video update has failed.',
    id: 'component.VideoRetentionDate.updateVideoFail',
  },
});

export const RetentionDate = () => {
  const intl = useIntl();
  const video = useCurrentVideo();

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSuccess), {
        position: 'bottom-center',
      });
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.updateVideoFail), {
        position: 'bottom-center',
      });
    },
  });

  const debouncedUpdatedVideo = debounce<Video>(
    (updatedVideoProperty: Partial<Video>) => {
      videoMutation.mutate(updatedVideoProperty);
    },
  );

  return (
    <CommonRetentionDate
      retentionDate={video.retention_date}
      ressource={intl.formatMessage(messages.ressource)}
      onChange={function (newRetentionDate: string | null): void {
        debouncedUpdatedVideo({
          retention_date: newRetentionDate,
        });
      }}
    />
  );
};

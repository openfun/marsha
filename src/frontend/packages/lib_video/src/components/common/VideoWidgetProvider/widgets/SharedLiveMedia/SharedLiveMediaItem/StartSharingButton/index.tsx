import { Button } from '@openfun/cunningham-react';
import { SharedLiveMedia, report } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useStartSharingMedia } from '@lib-video/api/useStartSharingMedia';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  updateSharedLiveMediaSucces: {
    defaultMessage: 'Shared media updated.',
    description:
      'Message displayed when a shared media is successfully updated.',
    id: 'component.StartSharingButton.updateSharedLiveMediaSucces',
  },
  updateSharedLiveMediaFail: {
    defaultMessage: 'Shared media update has failed !',
    description: 'Message displayed when shared media update has failed.',
    id: 'component.StartSharingButton.updateSharedLiveMediaFail',
  },
  publishSharedLiveMediaBtn: {
    defaultMessage: 'Share',
    description:
      'Label of the button allowing instructor to share a media with its students.',
    id: 'component.StartSharingButton.publishSharedLiveMediaBtn',
  },
});

interface StartSharingButtonProps {
  sharedLiveMediaId: SharedLiveMedia['id'];
}

export const StartSharingButton = ({
  sharedLiveMediaId,
}: StartSharingButtonProps) => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const shareMediaStart = useStartSharingMedia(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateSharedLiveMediaSucces), {
        position: 'bottom-center',
      });
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(intl.formatMessage(messages.updateSharedLiveMediaFail), {
        position: 'bottom-center',
      });
    },
  });

  return (
    <Button
      disabled={!!video.active_shared_live_media}
      aria-label={intl.formatMessage(messages.publishSharedLiveMediaBtn)}
      onClick={() =>
        shareMediaStart.mutate({
          sharedlivemedia: sharedLiveMediaId,
        })
      }
      title={intl.formatMessage(messages.publishSharedLiveMediaBtn)}
      size="small"
    >
      {intl.formatMessage(messages.publishSharedLiveMediaBtn)}
    </Button>
  );
};

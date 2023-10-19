import { Button } from '@openfun/cunningham-react';
import { report } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useStopSharingMedia } from '@lib-video/api/useStopSharingMedia';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  updateSharedLiveMediaSucces: {
    defaultMessage: 'Shared media updated.',
    description:
      'Message displayed when a shared media is successfully updated.',
    id: 'component.StopSharingButton.updateSharedLiveMediaSucces',
  },
  updateSharedLiveMediaFail: {
    defaultMessage: 'Shared media update has failed !',
    description: 'Message displayed when shared media update has failed.',
    id: 'component.StopSharingButton.updateSharedLiveMediaFail',
  },
  unpublishSharedLiveMediaBtn: {
    defaultMessage: 'Stop sharing',
    description:
      'Label of the button allowing instructor to stop sharing a media with its students.',
    id: 'component.StopSharingButton.unpublishSharedLiveMediaBtn',
  },
});

export const StopSharingButton = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const shareMediaStop = useStopSharingMedia(video.id, {
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
      color="danger"
      aria-label={intl.formatMessage(messages.unpublishSharedLiveMediaBtn)}
      onClick={() => shareMediaStop.mutate()}
      title={intl.formatMessage(messages.unpublishSharedLiveMediaBtn)}
      style={{ whiteSpace: 'nowrap' }}
      size="small"
    >
      {intl.formatMessage(messages.unpublishSharedLiveMediaBtn)}
    </Button>
  );
};

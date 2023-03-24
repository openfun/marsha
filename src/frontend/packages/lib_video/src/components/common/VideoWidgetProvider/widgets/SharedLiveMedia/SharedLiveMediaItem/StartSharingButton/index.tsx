import { Button } from 'grommet';
import { SharedLiveMedia, report } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

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

const StyledButton = styled(Button)`
  font-family: Roboto-Medium;
  font-size: 0.7rem;
  padding: 0px 3px 0px 3px;
  margin: 0px;
`;

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
    <StyledButton
      a11yTitle={intl.formatMessage(messages.publishSharedLiveMediaBtn)}
      disabled={!!video.active_shared_live_media}
      label={intl.formatMessage(messages.publishSharedLiveMediaBtn)}
      onClick={() =>
        shareMediaStart.mutate({
          sharedlivemedia: sharedLiveMediaId,
        })
      }
      primary
      title={intl.formatMessage(messages.publishSharedLiveMediaBtn)}
    />
  );
};

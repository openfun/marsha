import { Button } from 'grommet';
import { report } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

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

const StyledButton = styled(Button)`
  font-family: Roboto-Medium;
  font-size: 0.7rem;
  margin: 0px;
`;

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
    <StyledButton
      a11yTitle={intl.formatMessage(messages.unpublishSharedLiveMediaBtn)}
      color="red-active"
      label={intl.formatMessage(messages.unpublishSharedLiveMediaBtn)}
      onClick={() => shareMediaStop.mutate()}
      primary
      title={intl.formatMessage(messages.unpublishSharedLiveMediaBtn)}
      style={{ whiteSpace: 'nowrap' }}
      pad={{ horizontal: 'small', vertical: 'xsmall' }}
    />
  );
};

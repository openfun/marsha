import { Button } from '@openfun/cunningham-react';
import { NoDownloadSVG, SharedLiveMedia, report } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateSharedLiveMedia } from '@lib-video/api/useUpdateSharedLiveMedia';

const messages = defineMessages({
  updateSharedLiveMediaSucces: {
    defaultMessage: 'Shared media updated.',
    description:
      'Message displayed when a shared media is successfully updated.',
    id: 'component.DisallowedDownloadButton.updateSharedLiveMediaSucces',
  },
  updateSharedLiveMediaFail: {
    defaultMessage: 'Shared media update has failed !',
    description: 'Message displayed when shared media update has failed.',
    id: 'component.DisallowedDownloadButton.updateSharedLiveMediaFail',
  },
  buttonLabel: {
    defaultMessage:
      'Click on this button to allow students to download the media.',
    description:
      'The label of the button for allowing the students to download the media.',
    id: 'component.DisallowedDownloadButton.buttonLabel',
  },
});

interface DisallowedDownloadedButtonProps {
  videoId: SharedLiveMedia['video'];
  sharedLiveMediaId: SharedLiveMedia['id'];
}

export const DisallowedDownloadButton = ({
  videoId,
  sharedLiveMediaId,
}: DisallowedDownloadedButtonProps) => {
  const intl = useIntl();

  const sharedLiveMediaMutation = useUpdateSharedLiveMedia(
    videoId,
    sharedLiveMediaId,
    {
      onSuccess: () => {
        toast.success(
          intl.formatMessage(messages.updateSharedLiveMediaSucces),
          {
            position: 'bottom-center',
          },
        );
      },
      onError: (err: unknown) => {
        report(err);
        toast.error(intl.formatMessage(messages.updateSharedLiveMediaFail), {
          position: 'bottom-center',
        });
      },
    },
  );

  return (
    <Button
      aria-label={intl.formatMessage(messages.buttonLabel)}
      onClick={() =>
        sharedLiveMediaMutation.mutate({
          show_download: true,
        })
      }
      title={intl.formatMessage(messages.buttonLabel)}
      color="tertiary"
      icon={<NoDownloadSVG iconColor="blue-off" width="24px" height="24px" />}
    />
  );
};

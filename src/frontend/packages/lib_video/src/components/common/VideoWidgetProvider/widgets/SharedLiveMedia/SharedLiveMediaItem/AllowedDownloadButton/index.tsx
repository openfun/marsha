import { Button } from '@openfun/cunningham-react';
import { colorsTokens } from 'lib-common';
import { DownloadSVG, SharedLiveMedia, report } from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateSharedLiveMedia } from '@lib-video/api/useUpdateSharedLiveMedia';

const messages = defineMessages({
  updateSharedLiveMediaSucces: {
    defaultMessage: 'Shared media updated.',
    description:
      'Message displayed when a shared media is successfully updated.',
    id: 'component.AllowedDownloadButton.updateSharedLiveMediaSucces',
  },
  updateSharedLiveMediaFail: {
    defaultMessage: 'Shared media update has failed !',
    description: 'Message displayed when shared media update has failed.',
    id: 'component.AllowedDownloadButton.updateSharedLiveMediaFail',
  },
  buttonLabel: {
    defaultMessage:
      'Click on this button to stop allowing students to download this media.',
    description:
      'The label of the button for stopping to allow students to download the media.',
    id: 'component.AllowedDownloadButton.buttonLabel',
  },
});

interface AllowedDownloadButtonProps {
  videoId: SharedLiveMedia['video'];
  sharedLiveMediaId: SharedLiveMedia['id'];
}

export const AllowedDownloadButton = ({
  videoId,
  sharedLiveMediaId,
}: AllowedDownloadButtonProps) => {
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
          show_download: false,
        })
      }
      title={intl.formatMessage(messages.buttonLabel)}
      icon={
        <DownloadSVG
          iconColor={colorsTokens['info-500']}
          width="24px"
          height="24px"
        />
      }
      color="tertiary"
    />
  );
};

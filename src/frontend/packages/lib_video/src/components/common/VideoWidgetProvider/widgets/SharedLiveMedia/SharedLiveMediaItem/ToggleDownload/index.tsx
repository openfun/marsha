import { Switch } from '@openfun/cunningham-react';
import { SharedLiveMedia, report } from 'lib-components';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateSharedLiveMedia } from '@lib-video/api/useUpdateSharedLiveMedia';

const messages = defineMessages({
  updateSharedLiveMediaSucces: {
    defaultMessage: 'Shared media updated.',
    description:
      'Message displayed when a shared media is successfully updated.',
    id: 'component.ToggleDownload.updateSharedLiveMediaSucces',
  },
  updateSharedLiveMediaFail: {
    defaultMessage: 'Shared media update has failed !',
    description: 'Message displayed when shared media update has failed.',
    id: 'component.ToggleDownload.updateSharedLiveMediaFail',
  },
  labelToggleAllowDownloadSupport: {
    defaultMessage: 'Allow download',
    description:
      'Label of the toggle allowing to download the support share by the instructor',
    id: 'component.ToggleDownload.labelToggleAllowDownloadSupport',
  },
});

interface ToggleDownloadProps {
  isDownloadAllowed: boolean;
  videoId: SharedLiveMedia['video'];
  sharedLiveMediaId: SharedLiveMedia['id'];
}

export const ToggleDownload = ({
  isDownloadAllowed,
  videoId,
  sharedLiveMediaId,
}: ToggleDownloadProps) => {
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
        setIsLocalDownloadAllowed(isDownloadAllowed);
      },
    },
  );

  const [isLocalDownloadAllowed, setIsLocalDownloadAllowed] =
    useState(isDownloadAllowed);

  useEffect(() => {
    setIsLocalDownloadAllowed(isDownloadAllowed);
  }, [isDownloadAllowed]);

  return (
    <Switch
      checked={isLocalDownloadAllowed}
      onChange={() => {
        sharedLiveMediaMutation.mutate({
          show_download: !isLocalDownloadAllowed,
        });
        setIsLocalDownloadAllowed(!isLocalDownloadAllowed);
      }}
      label={intl.formatMessage(messages.labelToggleAllowDownloadSupport)}
      labelSide="right"
    />
  );
};

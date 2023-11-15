import { Switch } from '@openfun/cunningham-react';
import { SharedLiveMedia, report } from 'lib-components';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useStartSharingMedia, useStopSharingMedia } from '@lib-video/api';

const messages = defineMessages({
  updateSharedLiveMediaSucces: {
    defaultMessage: 'Shared media updated.',
    description:
      'Message displayed when a shared media is successfully updated.',
    id: 'component.ToggleSharing.updateSharedLiveMediaSucces',
  },
  updateSharedLiveMediaFail: {
    defaultMessage: 'Shared media update has failed !',
    description: 'Message displayed when shared media update has failed.',
    id: 'component.ToggleSharing.updateSharedLiveMediaFail',
  },
  labelToggleShareSupport: {
    defaultMessage: 'Share support',
    description:
      'Label of the toggle allowing instructor to share a media with its students.',
    id: 'component.ToggleSharing.labelToggleShareSupport',
  },
});

interface ToggleSharingProps {
  isShared: boolean | null;
  sharedLiveMediaId: SharedLiveMedia['id'];
  videoId: SharedLiveMedia['video'];
}

export const ToggleSharing = ({
  isShared,
  sharedLiveMediaId,
  videoId,
}: ToggleSharingProps) => {
  const intl = useIntl();
  const shareMediaStart = useStartSharingMedia(videoId, {
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
      setIsLocalShared(isShared);
    },
  });

  const shareMediaStop = useStopSharingMedia(videoId, {
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
      setIsLocalShared(isShared);
    },
  });

  const [isLocalShared, setIsLocalShared] = useState(isShared);

  useEffect(() => {
    setIsLocalShared(isShared);
  }, [isShared]);

  return (
    <Switch
      checked={!!isLocalShared}
      onChange={() => {
        setIsLocalShared(!isLocalShared);
        isLocalShared
          ? shareMediaStop.mutate()
          : shareMediaStart.mutate({
              sharedlivemedia: sharedLiveMediaId,
            });
      }}
      label={intl.formatMessage(messages.labelToggleShareSupport)}
      labelSide="right"
    />
  );
};

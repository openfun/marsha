import { Button } from 'grommet';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { NoDownloadSVG } from 'components/SVGIcons/NoDownloadSVG';
import { useUpdateSharedLiveMedia } from 'data/queries';
import { SharedLiveMedia } from 'types/tracks';
import { report } from 'utils/errors/report';

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
  sharedLiveMediaId: SharedLiveMedia['id'];
}

export const DisallowedDownloadButton = ({
  sharedLiveMediaId,
}: DisallowedDownloadedButtonProps) => {
  const intl = useIntl();

  const sharedLiveMediaMutation = useUpdateSharedLiveMedia(sharedLiveMediaId, {
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
      a11yTitle={intl.formatMessage(messages.buttonLabel)}
      onClick={() =>
        sharedLiveMediaMutation.mutate({
          show_download: true,
        })
      }
      plain
      style={{ display: 'flex', padding: 0 }}
      title={intl.formatMessage(messages.buttonLabel)}
    >
      <NoDownloadSVG iconColor="blue-off" width="24px" height="24px" />
    </Button>
  );
};

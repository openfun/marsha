import { Button } from 'grommet';
import { BinSVG, TimedText } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useDeleteTimedTextTrackUploadModal } from '@lib-video/hooks/useDeleteTimedTextTrackUploadModal';

const messages = defineMessages({
  buttonLabel: {
    defaultMessage: 'Click on this button to delete the timed text track.',
    description: 'The label of the button to delete the timed text track.',
    id: 'components.DeleteTimedTextTrackItemUploadButton.buttonLabel',
  },
});

interface DeleteTimedTextTrackItemUploadButtonProps {
  timedTextTrack: TimedText;
}

export const DeleteTimedTextTrackItemUploadButton = ({
  timedTextTrack,
}: DeleteTimedTextTrackItemUploadButtonProps) => {
  const [_, setDeleteTimedTextTrackUploadModal] =
    useDeleteTimedTextTrackUploadModal();
  const intl = useIntl();

  return (
    <Button
      a11yTitle={intl.formatMessage(messages.buttonLabel)}
      onClick={() => setDeleteTimedTextTrackUploadModal(timedTextTrack)}
      plain
      style={{ display: 'flex', padding: 0 }}
    >
      <BinSVG height="18px" iconColor="blue-active" width="14px" />
    </Button>
  );
};

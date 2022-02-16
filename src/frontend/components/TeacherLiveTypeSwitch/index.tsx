import { Box, CheckBox, Paragraph } from 'grommet';
import React from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { updateResource } from 'data/sideEffects/updateResource';
import { useLiveFeedback } from 'data/stores/useLiveFeedback';
import { useVideo } from 'data/stores/useVideo';
import { modelName } from 'types/models';
import { LiveModeType, Video } from 'types/tracks';

const messages = defineMessages({
  RAW: {
    defaultMessage: 'Raw',
    description: 'Title for live mode RAW',
    id: 'component.TeacherLiveTypeSwitch.RAW',
  },
  JITSI: {
    defaultMessage: 'Jitsi',
    description: 'Title for live mode JITSI',
    id: 'component.TeacherLiveTypeSwitch.JITSI',
  },
  error: {
    defaultMessage: 'An error occured, pease try again.',
    description:
      'Message displayed when an error occured when trying to switch live mode',
    id: 'component.TeacherLiveTypeSwitch.message',
  },
});

interface TeacherLiveTypeSwitchProps {
  video: Video;
}

export const TeacherLiveTypeSwitch = ({
  video,
}: TeacherLiveTypeSwitchProps) => {
  const intl = useIntl();
  const [_, setIsLiveFeedbackVisible] = useLiveFeedback();
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));

  const configureLive = async (type: LiveModeType) => {
    try {
      const updatedVideo = await updateResource(
        {
          ...video,
          live_type: type,
        },
        modelName.VIDEOS,
      );

      if (type === LiveModeType.JITSI) {
        setIsLiveFeedbackVisible(false);
      }
      updateVideo(updatedVideo);
    } catch (error) {
      toast.error(intl.formatMessage(messages.error));
    }
  };

  return (
    <Box direction="row">
      <Paragraph margin={{ vertical: 'auto', right: 'small' }}>
        {intl.formatMessage(messages.RAW)}
      </Paragraph>
      <CheckBox
        checked={video.live_type === LiveModeType.JITSI}
        onChange={(event) => {
          if (event.target.checked) {
            configureLive(LiveModeType.JITSI);
          } else {
            configureLive(LiveModeType.RAW);
          }
        }}
        toggle
      />
      <Paragraph margin={{ vertical: 'auto', left: 'small' }}>
        {intl.formatMessage(messages.JITSI)}
      </Paragraph>
    </Box>
  );
};

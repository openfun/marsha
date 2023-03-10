import { Box } from 'grommet';
import { report, ToggleInput, FoldableItem } from 'lib-components';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from 'api/useUpdateVideo';
import { useCurrentVideo } from 'hooks/useCurrentVideo';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to activate / deactivate some live features.',
    description: 'Info of the widget used for setting live features.',
    id: 'components.ToolsAndApplications.info',
  },
  title: {
    defaultMessage: 'Tools and applications',
    description:
      'Title of the widget used for setting live title and activate recording.',
    id: 'components.ToolsAndApplications.title',
  },
  chatActiveLabel: {
    defaultMessage: 'Activate chat',
    description:
      'The label associated to the toggle button reponsible of live chat activation / deactivation.',
    id: 'components.ToolsAndApplications.chatActiveLabel',
  },
  recordingToggleLabel: {
    defaultMessage: 'Activate live recording',
    description:
      'The label associated to the toggle button reponsible of live recording activation / deactivation.',
    id: 'component.ToolsAndApplications.liveRecordingToggleLabel',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.ToolsAndApplications.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'component.ToolsAndApplications.updateVideoFail',
  },
});

export const ToolsAndApplications = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [isChatActive, setChatActive] = useState(video.has_chat);
  const [isAllowRecordingActive, setIsAllowRecordingActive] = useState(
    video.allow_recording,
  );

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSucces), {
        position: 'bottom-center',
      });
    },
    onError: (err, variables) => {
      if ('has_chat' in variables) {
        setChatActive(video.has_chat);
      }
      if ('allow_recording' in variables) {
        setIsAllowRecordingActive(video.allow_recording);
      }
      report(err);
      toast.error(intl.formatMessage(messages.updateVideoFail), {
        position: 'bottom-center',
      });
    },
  });

  const onChatActiveChange = () => {
    setChatActive(!video.has_chat);
    videoMutation.mutate({
      has_chat: !video.has_chat,
    });
  };

  useEffect(() => {
    setChatActive(video.has_chat);
    setIsAllowRecordingActive(video.allow_recording);
  }, [video.has_chat, video.allow_recording]);

  const onAllowRecordingActiveChange = () => {
    setIsAllowRecordingActive(!video.allow_recording);
    videoMutation.mutate({
      allow_recording: !video.allow_recording,
    });
  };
  // Do not display the component for original VODs
  if (video.live_state === null) {
    return null;
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <ToggleInput
          checked={isChatActive}
          onChange={onChatActiveChange}
          label={intl.formatMessage(messages.chatActiveLabel)}
        />
        <ToggleInput
          disabled={video.is_recording}
          checked={isAllowRecordingActive}
          onChange={onAllowRecordingActiveChange}
          label={intl.formatMessage(messages.recordingToggleLabel)}
        />
      </Box>
    </FoldableItem>
  );
};

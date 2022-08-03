import { Box } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { toast } from 'react-hot-toast';

import { ToggleInput } from 'components/common/dashboard/widgets/inputs/ToggleInput';
import { WidgetTemplate } from 'components/common/dashboard/widgets/WidgetTemplate';
import { useUpdateVideo } from 'data/queries';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { report } from 'utils/errors/report';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to activate / deactivate some live features.',
    description: 'Info of the widget used for setting live features.',
    id: 'components.DashboardLiveWidgetToolsAndApplications.info',
  },
  title: {
    defaultMessage: 'Tools and applications',
    description:
      'Title of the widget used for setting live title and activate recording.',
    id: 'components.DashboardLiveWidgetToolsAndApplications.title',
  },
  chatActiveLabel: {
    defaultMessage: 'Activate chat',
    description:
      'The label associated to the toggle button reponsible of live chat activation / deactivation.',
    id: 'components.DashboardLiveWidgetToolsAndApplications.chatActiveLabel',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.DashboardLiveWidgetToolsAndApplications.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'component.DashboardLiveWidgetToolsAndApplications.updateVideoFail',
  },
});

export const DashboardLiveWidgetToolsAndApplications = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [isChatActive, setChatActive] = useState(video.has_chat);

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

  return (
    <WidgetTemplate
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
      </Box>
    </WidgetTemplate>
  );
};

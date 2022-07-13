import ClipboardJS from 'clipboard';
import { Box, Button, Collapsible, Text } from 'grommet';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { toast } from 'react-hot-toast';

import { DashboardVideoLiveWidgetDashedBoxCustom } from 'components/DashboardVideoLiveControlPane/customs/DashboardVideoLiveWidgetDashedBoxCustom';
import { DashboardVideoLiveWidgetToggleInput } from 'components/DashboardVideoLiveControlPane/inputs/DashboardVideoLiveWidgetToggleInput';
import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';
import { CopySVG } from 'components/SVGIcons/CopySVG';
import { useUpdateVideo } from 'data/queries';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { report } from 'utils/errors/report';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to make the video publicly available.',
    description: 'Info of the widget used for setting live features.',
    id: 'components.DashboardVideoLiveWidgetVisibilityAndInteraction.info',
  },
  title: {
    defaultMessage: 'Visibility and interaction parameters',
    description:
      'Title of the widget used for set the public availability of the video.',
    id: 'components.DashboardVideoLiveWidgetVisibilityAndInteraction.title',
  },
  publiclyAvailableLabel: {
    defaultMessage: 'Make the video publicly available',
    description:
      'The label associated to the toggle button reponsible of video public visibility.',
    id: 'components.DashboardVideoLiveWidgetVisibilityAndInteraction.publiclyAvailableLabel',
  },
  copyButtonTitle: {
    defaultMessage:
      "A button to copy the video's publicly available url in clipboard",
    description:
      'A message informing the user on the action of the copy-in-clipboard button.',
    id: 'components.DashboardVideoLiveWidgetVisibilityAndInteraction.copyButtonTitle',
  },
  copySuccess: {
    defaultMessage: 'Url copied in clipboard !',
    description:
      "Message displayed when video's publicly available url is copied in clipboard.",
    id: 'components.DashboardVideoLiveWidgetVisibilityAndInteraction.copySuccess',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.DashboardVideoLiveWidgetVisibilityAndInteraction.updateVideoSucces',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'component.DashboardVideoLiveWidgetVisibilityAndInteraction.updateVideoFail',
  },
});

export const DashboardVideoLiveWidgetVisibilityAndInteraction = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [visibilityChecked, setVisibilityChecked] = useState(video.is_public);

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSucces), {
        position: 'bottom-center',
      });
    },
    onError: (err, variables) => {
      if ('is_public' in variables) {
        setVisibilityChecked(video.is_public);
      }
      report(err);
      toast.error(intl.formatMessage(messages.updateVideoFail), {
        position: 'bottom-center',
      });
    },
  });

  const onToggleChange = () => {
    setVisibilityChecked(!video.is_public);
    videoMutation.mutate({
      is_public: !video.is_public,
    });
  };

  useEffect(() => {
    if (video.is_public) {
      const clipboard = new ClipboardJS('.copy');
      clipboard.on('success', () => {
        toast(intl.formatMessage(messages.copySuccess), {
          icon: '📋',
          position: 'bottom-center',
        });
      });

      clipboard.on('error', (event) => {
        toast.error(event.text, {
          position: 'bottom-center',
        });
      });
      return () => clipboard.destroy();
    }
  }, [video.is_public]);

  const publicVideoUrl = window.location.origin
    .concat('/videos/')
    .concat(video.id);

  return (
    <DashboardVideoLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <DashboardVideoLiveWidgetToggleInput
          checked={visibilityChecked}
          onChange={onToggleChange}
          label={intl.formatMessage(messages.publiclyAvailableLabel)}
        />
        <Collapsible open={visibilityChecked}>
          <DashboardVideoLiveWidgetDashedBoxCustom>
            <Text
              color={video.is_public ? 'blue-active' : '#b4cff2'}
              size="0.875rem"
              style={{ fontFamily: 'Roboto-Medium' }}
              truncate
            >
              {publicVideoUrl}
            </Text>

            <Button
              a11yTitle={intl.formatMessage(messages.copyButtonTitle)}
              className={'copy'}
              data-clipboard-text={publicVideoUrl}
              plain
              style={{ display: 'flex', padding: 0 }}
              title={intl.formatMessage(messages.copyButtonTitle)}
            >
              <CopySVG iconColor="blue-active" width="20px" height="25px" />
            </Button>
          </DashboardVideoLiveWidgetDashedBoxCustom>
        </Collapsible>
      </Box>
    </DashboardVideoLiveWidgetTemplate>
  );
};

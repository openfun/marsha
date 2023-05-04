import { Box, Collapsible } from 'grommet';
import {
  report,
  CopyClipboard,
  ToggleInput,
  FoldableItem,
} from 'lib-components';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to make the video publicly available.',
    description: 'Info of the widget used for setting live features.',
    id: 'components.VisibilityAndInteraction.info',
  },
  title: {
    defaultMessage: 'Visibility and interaction parameters',
    description:
      'Title of the widget used for set the public availability of the video.',
    id: 'components.VisibilityAndInteraction.title',
  },
  publiclyAvailableLabel: {
    defaultMessage: 'Make the video publicly available',
    description:
      'The label associated to the toggle button reponsible of video public visibility.',
    id: 'components.VisibilityAndInteraction.publiclyAvailableLabel',
  },
  publicLinkCopyButtonTitle: {
    defaultMessage: 'Public link:',
    description:
      'A message informing the user on the action of the copy-in-clipboard button.',
    id: 'components.VisibilityAndInteraction.publicLinkCopyButtonTitle',
  },
  iFrameCopyButtonTitle: {
    defaultMessage: 'Iframe integration:',
    description:
      'A message informing the user on the action of the copy-in-clipboard button.',
    id: 'components.VisibilityAndInteraction.iFrameCopyButtonTitle',
  },
  publicLinkCopySuccess: {
    defaultMessage: 'Url copied in clipboard !',
    description:
      "Message displayed when video's publicly available url is copied in clipboard.",
    id: 'components.VisibilityAndInteraction.publicLinkCopySuccess',
  },
  iFrameCopySuccess: {
    defaultMessage: 'Code copied in clipboard !',
    description:
      "Message displayed when video's publicly available iframe code is copied in clipboard.",
    id: 'components.VisibilityAndInteraction.iFrameCopySuccess',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.VisibilityAndInteraction.updateVideoSucces',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'component.VisibilityAndInteraction.updateVideoFail',
  },
});

export const VisibilityAndInteraction = () => {
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

  useEffect(() => {
    setVisibilityChecked(video.is_public);
  }, [video.is_public]);

  const onToggleChange = () => {
    setVisibilityChecked(!video.is_public);
    videoMutation.mutate({
      is_public: !video.is_public,
    });
  };

  const publicVideoUrl = window.location.origin
    .concat('/videos/')
    .concat(video.id);

  const parametersWebinar = video.is_live
    ? 'microphone *; camera *; midi *; display-capture *; '
    : '';
  const iframeCode = `<iframe src="${publicVideoUrl}" allowfullscreen="true" allow="${parametersWebinar}encrypted-media *; autoplay *; fullscreen *" />`;

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <ToggleInput
          checked={visibilityChecked}
          onChange={onToggleChange}
          label={intl.formatMessage(messages.publiclyAvailableLabel)}
        />
        <Collapsible open={visibilityChecked}>
          <CopyClipboard
            copyId={`publicVideoUrl-${video.id}`}
            isActive={video.is_public}
            text={publicVideoUrl}
            title={intl.formatMessage(messages.publicLinkCopyButtonTitle)}
            onSuccess={() => {
              toast(intl.formatMessage(messages.publicLinkCopySuccess), {
                icon: '📋',
                position: 'bottom-center',
              });
            }}
            onError={(event) => {
              toast.error(event.text, {
                position: 'bottom-center',
              });
            }}
            withLabel
          />
          <Box margin={{ top: 'small' }}>
            <CopyClipboard
              copyId={`iframeVideoUrl-${video.id}`}
              isActive={video.is_public}
              text={iframeCode}
              title={intl.formatMessage(messages.iFrameCopyButtonTitle)}
              onSuccess={() => {
                toast(intl.formatMessage(messages.iFrameCopySuccess), {
                  icon: '📋',
                  position: 'bottom-center',
                });
              }}
              onError={(event) => {
                toast.error(event.text, {
                  position: 'bottom-center',
                });
              }}
              withLabel
              textProps={{
                style: {
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                },
                truncate: false,
              }}
            />
          </Box>
        </Collapsible>
      </Box>
    </FoldableItem>
  );
};

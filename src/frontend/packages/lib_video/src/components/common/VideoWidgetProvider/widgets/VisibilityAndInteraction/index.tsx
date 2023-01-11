import { Box, Collapsible } from 'grommet';
import { report, CopyClipboard, ToggleInput } from 'lib-components';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from 'api/useUpdateVideo';
import { useCurrentVideo } from 'hooks/useCurrentVideo';

import { FoldableItem } from '../../FoldableItem';

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
  copyButtonTitle: {
    defaultMessage:
      "A button to copy the video's publicly available url in clipboard",
    description:
      'A message informing the user on the action of the copy-in-clipboard button.',
    id: 'components.VisibilityAndInteraction.copyButtonTitle',
  },
  copySuccess: {
    defaultMessage: 'Url copied in clipboard !',
    description:
      "Message displayed when video's publicly available url is copied in clipboard.",
    id: 'components.VisibilityAndInteraction.copySuccess',
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
            isActive={video.is_public}
            text={publicVideoUrl}
            title={intl.formatMessage(messages.copyButtonTitle)}
            onSuccess={() => {
              toast(intl.formatMessage(messages.copySuccess), {
                icon: '📋',
                position: 'bottom-center',
              });
            }}
            onError={(event) => {
              toast.error(event.text, {
                position: 'bottom-center',
              });
            }}
          />
        </Collapsible>
      </Box>
    </FoldableItem>
  );
};

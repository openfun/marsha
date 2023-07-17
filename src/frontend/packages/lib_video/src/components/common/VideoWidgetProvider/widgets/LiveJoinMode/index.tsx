import { Box, Select } from 'grommet';
import { FoldableItem, JoinMode, report } from 'lib-components';
import React from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const { APPROVAL, DENIED, FORCED } = JoinMode;

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to select permissions for students to join the discussion.',
    description: 'Info of the widget used for setting join modes.',
    id: 'components.LiveJoinMode.info',
  },
  title: {
    defaultMessage: 'Join the discussion',
    description: 'Title of the widget used for setting join modes.',
    id: 'components.LiveJoinMode.title',
  },
  selectLabel: {
    defaultMessage: 'Select join the discussion mode',
    description: 'The label for the select to set join modes.',
    id: 'components.LiveJoinMode.selectLabel',
  },
  approval: {
    defaultMessage: 'Accept joining the discussion after approval',
    description: 'The label associated to the approval join mode.',
    id: 'components.LiveJoinMode.approvalLabel',
  },
  denied: {
    defaultMessage: 'Not allowed',
    description: 'The label associated to the denied join mode.',
    id: 'components.LiveJoinMode.deniedLabel',
  },
  forced: {
    defaultMessage: 'Everybody will join the discussion',
    description: 'The label associated to the forced join mode.',
    id: 'components.LiveJoinMode.forcedLabel',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.LiveJoinMode.updateVideoSucces',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'component.LiveJoinMode.updateVideoFail',
  },
});

export const LiveJoinMode = () => {
  const video = useCurrentVideo();
  const intl = useIntl();

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSucces), {
        position: 'bottom-center',
      });
    },
    onError: (err) => {
      report(err);
      toast.error(intl.formatMessage(messages.updateVideoFail), {
        position: 'bottom-center',
      });
    },
  });

  const options = [
    {
      label: intl.formatMessage(messages[APPROVAL]),
      value: APPROVAL,
    },
    {
      label: intl.formatMessage(messages[DENIED]),
      value: DENIED,
    },
    {
      label: intl.formatMessage(messages[FORCED]),
      value: FORCED,
    },
  ];

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <Select
          aria-label={intl.formatMessage(messages.selectLabel)}
          options={options}
          labelKey="label"
          replace={false}
          valueKey={{ key: 'value', reduce: true }}
          value={video.join_mode}
          onChange={({
            option,
          }: {
            option: { label: string; value: JoinMode };
          }) => {
            videoMutation.mutate({
              join_mode: option.value,
            });
          }}
        />
      </Box>
    </FoldableItem>
  );
};

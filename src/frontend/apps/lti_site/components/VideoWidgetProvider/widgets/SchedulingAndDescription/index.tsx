import { DateTime, Duration } from 'luxon';
import { Box, Grommet, Text } from 'grommet';
import { DashedBoxCustom } from 'lib-components';
import React, { Fragment, useCallback, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { FoldableItem } from 'components/graphicals/FoldableItem';
import { TextAreaInput } from 'components/graphicals/TextAreaInput';
import { SchedulingFields, liveState, Video, report } from 'lib-components';
import { useUpdateVideo } from 'data/queries';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { theme } from 'lib-common';
import { debounce } from 'utils/widgets/widgets';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to schedule a webinar, and modify its description.',
    description:
      'Info of the widget used for scheduling and change description of a webinar.',
    id: 'components.SchedulingAndDescription.info',
  },
  title: {
    defaultMessage: 'Description',
    description:
      'Title of the widget used for setting live title and activate recording.',
    id: 'components.SchedulingAndDescription.title',
  },
  placeholderDescriptionInput: {
    defaultMessage: 'Description...',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.SchedulingAndDescription.placeholderDescriptionInput',
  },
  endDateWebinarLabel: {
    defaultMessage: "Webinar's end",
    description: 'When the webinar will end.',
    id: 'components.SchedulingAndDescription.endDateWebinarLabel',
  },
  notScheduledWebinar: {
    defaultMessage: 'Your live is not scheduled',
    description: 'The message displayed when the live is not scheduled',
    id: 'components.SchedulingAndDescription.notScheduledWebinar',
  },
  updateVideoSuccess: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video update is successful.',
    id: 'component.SchedulingAndDescription.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update failed.',
    id: 'component.SchedulingAndDescription.updateVideoFail',
  },
  updateDescriptionBlank: {
    defaultMessage: "Description can't be blank !",
    description:
      'Message displayed when the user tried to enter a blank description.',
    id: 'component.SchedulingAndDescription.updateDescriptionBlank',
  },
});

export const SchedulingAndDescription = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [description, setDescription] = useState(video.description);

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSuccess), {
        position: 'bottom-center',
      });
    },
    onError: (err, variables) => {
      if ('description' in variables) {
        setDescription(video.description);
      }
      report(err);
      toast.error(intl.formatMessage(messages.updateVideoFail), {
        position: 'bottom-center',
      });
    },
  });

  const debouncedUpdatedVideo = useCallback(
    debounce<Video>((updatedVideoProperty: Partial<Video>) => {
      videoMutation.mutate(updatedVideoProperty);
    }),
    [debounce, videoMutation.mutate],
  );

  useEffect(() => {
    setDescription(video.description);
  }, [video.description]);

  const handleChange = (updatedVideoProperty: Partial<Video>) => {
    debouncedUpdatedVideo(updatedVideoProperty);
  };

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={true}
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <Grommet theme={theme}>
          <SchedulingFields
            estimatedDuration={video.estimated_duration}
            disabled={video.live_state !== liveState.IDLE}
            margin="none"
            onEstimatedDurationChange={(estimatedDuration) => {
              handleChange({
                estimated_duration: estimatedDuration,
              });
            }}
            onStartingAtChange={(startingAt) => {
              handleChange({
                starting_at: startingAt,
              });
            }}
            startingAt={video.starting_at}
          />
        </Grommet>

        <DashedBoxCustom>
          {video.starting_at ? (
            <Fragment>
              <Text color="blue-active" size="0.875rem">
                {intl.formatMessage(messages.endDateWebinarLabel)}
              </Text>
              <Text color="blue-active" size="0.875rem">
                {video.estimated_duration
                  ? DateTime.fromISO(video.starting_at)
                      .plus(Duration.fromISOTime(video.estimated_duration))
                      .setLocale(intl.locale)
                      .toFormat(
                        intl.locale === 'fr'
                          ? 'dd/MM/yyyy, HH:mm'
                          : 'yyyy/MM/dd, HH:mm',
                      )
                  : ''}
              </Text>
            </Fragment>
          ) : (
            <Box fill>
              <Text alignSelf="center" color="blue-active" size="0.875rem">
                {intl.formatMessage(messages.notScheduledWebinar)}
              </Text>
            </Box>
          )}
        </DashedBoxCustom>

        <TextAreaInput
          placeholder={intl.formatMessage(messages.placeholderDescriptionInput)}
          value={description || ''}
          setValue={(inputText: string) => {
            setDescription(inputText);
            handleChange({ description: inputText });
          }}
          title={intl.formatMessage(messages.placeholderDescriptionInput)}
        />
      </Box>
    </FoldableItem>
  );
};

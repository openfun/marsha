import { TextArea } from '@openfun/cunningham-react';
import {
  Box,
  DashedBoxCustom,
  FoldableItem,
  SchedulingFields,
  Text,
  Video,
  debounce,
  liveState,
  report,
} from 'lib-components';
import { DateTime, Duration } from 'luxon';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

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
  const descriptionInit = useRef(video.description);
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

  const debouncedUpdatedVideo = debounce<Video>(
    (updatedVideoProperty: Partial<Video>) => {
      videoMutation.mutate(updatedVideoProperty);
    },
    1000,
  );

  useEffect(() => {
    const isIdle = descriptionInit.current === description;
    const isWriting = description !== video.description;
    if (isIdle || !isWriting) {
      setDescription(video.description);
      descriptionInit.current = video.description;
    }
  }, [description, video.description]);

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={true}
      title={intl.formatMessage(messages.title)}
    >
      <Box gap="small">
        <SchedulingFields
          estimatedDuration={video.estimated_duration}
          disabled={video.live_state !== liveState.IDLE}
          margin="none"
          onEstimatedDurationChange={(estimatedDuration) => {
            debouncedUpdatedVideo({
              estimated_duration: estimatedDuration,
            });
          }}
          onStartingAtChange={(startingAt) => {
            debouncedUpdatedVideo({
              starting_at: startingAt,
            });
          }}
          startingAt={video.starting_at}
          vertical
        />

        <DashedBoxCustom>
          {video.starting_at ? (
            <Fragment>
              <Text>{intl.formatMessage(messages.endDateWebinarLabel)}</Text>
              <Text>
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
              <Text textAlign="center">
                {intl.formatMessage(messages.notScheduledWebinar)}
              </Text>
            </Box>
          )}
        </DashedBoxCustom>

        <TextArea
          label={intl.formatMessage(messages.placeholderDescriptionInput)}
          value={description || ''}
          onChange={(e) => {
            setDescription(e.target.value);
            debouncedUpdatedVideo({ description: e.target.value });
          }}
          style={{
            minHeight: '150px',
          }}
          onInput={(e) => {
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
          }}
        />
      </Box>
    </FoldableItem>
  );
};

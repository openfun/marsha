import { DateTime, Duration } from 'luxon';
import { Box, Grommet, Text, ThemeType } from 'grommet';
import { deepMerge } from 'grommet/utils';
import React, { Fragment, useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardLiveWidgetDashedBoxCustom } from 'components/DashboardLive/DashboardLiveControlPane/customs/DashboardLiveWidgetDashedBoxCustom';
import { DashboardLiveWidgetTextAreaInput } from 'components/DashboardLive/DashboardLiveControlPane/inputs/DashboardLiveWidgetTextAreaInput';
import { DashboardLiveWidgetTemplate } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetTemplate';
import { SchedulingFields } from 'components/SchedulingFields';
import { useUpdateVideo } from 'data/queries';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { liveState, Video } from 'types/tracks';
import { report } from 'utils/errors/report';
import { theme } from 'utils/theme/theme';
import { debounce } from 'utils/widgets/widgets';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to schedule a webinar, and modify its description.',
    description:
      'Info of the widget used for scheduling and change description of a webinar.',
    id: 'components.DashboardLiveWidgetSchedulingAndDescription.info',
  },
  title: {
    defaultMessage: 'Description',
    description:
      'Title of the widget used for setting live title and activate recording.',
    id: 'components.DashboardLiveWidgetSchedulingAndDescription.title',
  },
  placeholderDescriptionInput: {
    defaultMessage: 'Description...',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.DashboardLiveWidgetSchedulingAndDescription.placeholderDescriptionInput',
  },
  endDateWebinarLabel: {
    defaultMessage: "Webinar's end",
    description: 'When the webinar will end.',
    id: 'components.DashboardLiveWidgetSchedulingAndDescription.endDateWebinarLabel',
  },
  notScheduledWebinar: {
    defaultMessage: 'Your live is not scheduled',
    description: 'The message displayed when the live is not scheduled',
    id: 'components.DashboardLiveWidgetSchedulingAndDescription.notScheduledWebinar',
  },
  updateVideoSuccess: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video update is successful.',
    id: 'component.DashboardLiveWidgetSchedulingAndDescription.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update failed.',
    id: 'component.DashboardLiveWidgetSchedulingAndDescription.updateVideoFail',
  },
  updateDescriptionBlank: {
    defaultMessage: "Description can't be blank !",
    description:
      'Message displayed when the user tried to enter a blank description.',
    id: 'component.DashboardLiveWidgetSchedulingAndDescription.updateDescriptionBlank',
  },
});

const schedulingFieldsTheme: ThemeType = deepMerge(theme, {
  global: {
    input: {
      font: {
        size: '0.8em',
      },
    },
  },
  box: {
    extend: null,
  },
  button: {
    extend: 'margin: 0 3% 0 0',
  },
  formField: {
    label: {
      size: '0.7rem',
      margin: '0.3rem 0.3rem 0 0.3rem',
      color: 'bg-grey',
    },
    border: {
      position: 'outer',
      side: 'all',
      color: 'blue-active',
      style: 'solid',
    },
    round: {
      size: 'xsmall',
    },
  },
  textInput: {
    extend: `padding: 0.3rem 0 0 0.3rem;`,
  },
  maskedInput: {
    extend: `padding: 0.3rem 0 0 0.3rem;`,
  },
  dateInput: {
    icon: {
      size: '18px',
    },
  },
  text: {
    extend: 'font-size: 0.7em',
  },
});

export const DashboardLiveWidgetSchedulingAndDescription = () => {
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

  const handleChange = (updatedVideoProperty: Partial<Video>) => {
    debouncedUpdatedVideo(updatedVideoProperty);
  };

  return (
    <DashboardLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={true}
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <Grommet theme={schedulingFieldsTheme}>
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

        <DashboardLiveWidgetDashedBoxCustom>
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
        </DashboardLiveWidgetDashedBoxCustom>

        <DashboardLiveWidgetTextAreaInput
          placeholder={intl.formatMessage(messages.placeholderDescriptionInput)}
          value={description || ''}
          setValue={(inputText: string) => {
            setDescription(inputText);
            handleChange({ description: inputText });
          }}
          title={intl.formatMessage(messages.placeholderDescriptionInput)}
        />
      </Box>
    </DashboardLiveWidgetTemplate>
  );
};

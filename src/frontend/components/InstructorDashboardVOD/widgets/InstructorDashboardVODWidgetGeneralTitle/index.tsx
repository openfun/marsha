import { Box } from 'grommet';
import React, { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardVideoLiveWidgetTextAreaInput } from 'components/DashboardVideoLiveControlPane/inputs/DashboardVideoLiveWidgetTextAreaInput';
import { DashboardVideoLiveWidgetTextInput } from 'components/DashboardVideoLiveControlPane/inputs/DashboardVideoLiveWidgetTextInput';
import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';
import { useUpdateVideo } from 'data/queries';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { Video } from 'types/tracks';
import { report } from 'utils/errors/report';
import { debounce } from 'utils/widgets/widgets';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to set the title of your video and its description',
    description:
      'Info of the widget used for setting title and live recording.',
    id: 'components.InstructorDashboardVODWidgetGeneralTitle.info',
  },
  title: {
    defaultMessage: 'General',
    description:
      'Title of the widget used for setting VOD title and activate recording.',
    id: 'components.InstructorDashboardVODWidgetGeneralTitle.title',
  },
  placeholderTitleInput: {
    defaultMessage: 'Enter title of your VOD here',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.InstructorDashboardVODWidgetGeneralTitle.placeholderTitleInput',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.InstructorDashboardVODWidgetGeneralTitle.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'component.InstructorDashboardVODWidgetGeneralTitle.updateVideoFail',
  },
  updateTitleBlank: {
    defaultMessage: "Title can't be blank !",
    description:
      'Message displayed when the user tried to enter a blank title.',
    id: 'component.InstructorDashboardVODWidgetGeneralTitle.updateTitleBlank',
  },
  placeholderDescriptionInput: {
    defaultMessage: 'Description...',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.InstructorDashboardVODWidgetGeneralTitle.placeholderDescriptionInput',
  },
});

export const InstructorDashboardVODWidgetGeneralTitle = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSucces), {
        position: 'bottom-center',
      });
    },
    onError: (err, variables) => {
      if ('title' in variables) {
        setTitle(video.title);
      }
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
      if (updatedVideoProperty.title === '') {
        toast.error(intl.formatMessage(messages.updateTitleBlank), {
          position: 'bottom-center',
        });
        setTitle(video.title);
        return;
      }
      videoMutation.mutate(updatedVideoProperty);
    }),
    [debounce, videoMutation.mutate, video.title],
  );

  const handleChange = (updatedVideoProperty: Partial<Video>) => {
    debouncedUpdatedVideo(updatedVideoProperty);
  };

  return (
    <DashboardVideoLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <DashboardVideoLiveWidgetTextInput
          placeholder={intl.formatMessage(messages.placeholderTitleInput)}
          value={title || ''}
          setValue={(inputText: string) => {
            setTitle(inputText);
            handleChange({ title: inputText });
          }}
          title={intl.formatMessage(messages.placeholderTitleInput)}
        />
        <DashboardVideoLiveWidgetTextAreaInput
          placeholder={intl.formatMessage(messages.placeholderDescriptionInput)}
          value={description || ''}
          setValue={(inputText: string) => {
            setDescription(inputText);
            handleChange({ description: inputText });
          }}
          title={intl.formatMessage(messages.placeholderDescriptionInput)}
        />
      </Box>
    </DashboardVideoLiveWidgetTemplate>
  );
};

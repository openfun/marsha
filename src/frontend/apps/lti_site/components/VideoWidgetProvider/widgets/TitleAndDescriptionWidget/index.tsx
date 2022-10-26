import { Box } from 'grommet';
import React, { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { FoldableItem } from 'components/graphicals/FoldableItem';
import { TextAreaInput } from 'components/graphicals/TextAreaInput';
import { TextInput } from 'components/graphicals/TextInput';
import { useUpdateVideo } from 'data/queries';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { Video, report } from 'lib-components';
import { debounce } from 'utils/widgets/widgets';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to set the title of your video and its description',
    description:
      'Info of the widget used for setting title and live recording.',
    id: 'components.TitleAndDescriptionWidget.info',
  },
  title: {
    defaultMessage: 'General',
    description:
      'Title of the widget used for setting VOD title and activate recording.',
    id: 'components.TitleAndDescriptionWidget.title',
  },
  placeholderTitleInput: {
    defaultMessage: 'Enter title of your VOD here',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.TitleAndDescriptionWidget.placeholderTitleInput',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.TitleAndDescriptionWidget.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'component.TitleAndDescriptionWidget.updateVideoFail',
  },
  updateTitleBlank: {
    defaultMessage: "Title can't be blank !",
    description:
      'Message displayed when the user tried to enter a blank title.',
    id: 'component.TitleAndDescriptionWidget.updateTitleBlank',
  },
  placeholderDescriptionInput: {
    defaultMessage: 'Description...',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.TitleAndDescriptionWidget.placeholderDescriptionInput',
  },
});

export const TitleAndDescriptionWidget = () => {
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
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <Box direction="column" gap="small">
        <TextInput
          placeholder={intl.formatMessage(messages.placeholderTitleInput)}
          value={title || ''}
          setValue={(inputText: string) => {
            setTitle(inputText);
            handleChange({ title: inputText });
          }}
          title={intl.formatMessage(messages.placeholderTitleInput)}
        />
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

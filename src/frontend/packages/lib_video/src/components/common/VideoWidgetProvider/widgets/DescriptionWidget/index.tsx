import { Video, report, TextAreaInput } from 'lib-components';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from 'api/useUpdateVideo';
import { useCurrentVideo } from 'hooks/useCurrentVideo';

import { FoldableItem } from '../../FoldableItem';
import { debounce } from '../../utils/widgets';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to set the title of your video and its description',
    description:
      'Info of the widget used for setting title and live recording.',
    id: 'components.DescriptionWidget.info',
  },
  title: {
    defaultMessage: 'Description',
    description: 'Title of the widget used for setting VOD description',
    id: 'components.DescriptionWidget.title',
  },
  placeholderTitleInput: {
    defaultMessage: 'Enter title of your VOD here',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.DescriptionWidget.placeholderTitleInput',
  },
  updateVideoSucces: {
    defaultMessage: 'Video updated.',
    description: 'Message displayed when video is successfully updated.',
    id: 'component.DescriptionWidget.updateVideoSuccess',
  },
  updateVideoFail: {
    defaultMessage: 'Video update has failed !',
    description: 'Message displayed when video update has failed.',
    id: 'component.DescriptionWidget.updateVideoFail',
  },
  placeholderDescriptionInput: {
    defaultMessage: 'Write a description to your video here.',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.DescriptionWidget.placeholderDescriptionInput',
  },
});

export const DescriptionWidget = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [description, setDescription] = useState(video.description);

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateVideoSucces), {
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

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <TextAreaInput
        placeholder={intl.formatMessage(messages.placeholderDescriptionInput)}
        value={description || ''}
        setValue={(inputText: string) => {
          setDescription(inputText);
          debouncedUpdatedVideo({ description: inputText });
        }}
        title={intl.formatMessage(messages.placeholderDescriptionInput)}
      />
    </FoldableItem>
  );
};

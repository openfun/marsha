import { TextArea } from '@openfun/cunningham-react';
import { FoldableItem, Video, debounce, report } from 'lib-components';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to set the description of your video',
    description:
      'Info of the widget used for setting title and live recording.',
    id: 'components.DescriptionWidget.info',
  },
  title: {
    defaultMessage: 'Description',
    description: 'Title of the widget used for setting VOD description',
    id: 'components.DescriptionWidget.title',
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
  const descriptionInit = useRef(video.description);
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
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
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
    </FoldableItem>
  );
};

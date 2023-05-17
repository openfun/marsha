import { Text, TextInput, Box, TextArea } from 'grommet';
import { Alert } from 'grommet-icons';
import { Nullable } from 'lib-common';
import {
  Form,
  FormField,
  modelName,
  UploadManagerStatus,
  useUploadManager,
  Video,
  useResponsive,
  ModalButton,
} from 'lib-components';
import { LicenseSelect, useCreateVideo, UploadVideoForm } from 'lib-video';
import { Fragment, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { useSelectPlaylist } from 'features/Playlist';

import routes from '../../routes';

const messages = defineMessages({
  titleLabel: {
    defaultMessage: 'Title',
    description: 'Label for title in video creation form.',
    id: 'features.Contents.features.Video.VideoCreateForm.titleLabel',
  },
  descriptionLabel: {
    defaultMessage: 'Description',
    description: 'Label for description in video creation form.',
    id: 'features.Contents.features.Video.VideoCreateForm.descriptionLabel',
  },
  licenseLabel: {
    defaultMessage: 'License',
    description: 'Label for license in video creation form.',
    id: 'features.Contents.features.Video.VideoCreateForm.licenseLabel',
  },
  requiredField: {
    defaultMessage: 'This field is required to create the video.',
    description: 'Message when video field is missing.',
    id: 'features.Contents.features.Video.VideoCreateForm.requiredField',
  },
  submitLabel: {
    defaultMessage: 'Add Video',
    description: 'Label for button submit in video creation form.',
    id: 'features.Contents.features.Video.VideoCreateForm.submitLabel',
  },
  Error: {
    defaultMessage: 'Sorry, an error has occurred. Please try again.',
    description: 'Text when there is an error.',
    id: 'features.Contents.features.Video.VideoCreateForm.Error',
  },
});

type VideoCreate = {
  playlist: string;
  title: string;
  description?: string;
  license?: string;
  videoFile?: Nullable<File>;
};

const VideoCreateForm = () => {
  const intl = useIntl();
  const history = useHistory();
  const { isDesktop } = useResponsive();
  const videoPath = routes.VIDEO.path;
  const { addUpload, uploadManagerState } = useUploadManager();
  const [video, setVideo] = useState<VideoCreate>({
    playlist: '',
    title: '',
  });
  const [newVideo, setNewVideo] = useState<Video>();
  const [isUploading, setIsUploading] = useState(false);
  const { errorPlaylist, selectPlaylist, playlistResponse } = useSelectPlaylist(
    { withPlaylistCreation: true },
  );
  const {
    mutate: createVideo,
    error: errorVideo,
    isLoading: isCreating,
  } = useCreateVideo({
    onSuccess: (data) => {
      setNewVideo(data);

      if (video.videoFile) {
        addUpload(modelName.VIDEOS, data.id, video.videoFile);
        setIsUploading(true);
      } else {
        history.push(`${videoPath}/${data.id}`);
      }
    },
  });

  useEffect(() => {
    if (!playlistResponse?.results || !playlistResponse?.count) {
      return;
    }

    setVideo((value) => ({
      ...value,
      playlist: playlistResponse.results[0].id,
    }));
  }, [playlistResponse?.results, playlistResponse?.count]);

  useEffect(() => {
    if (
      newVideo?.id &&
      uploadManagerState[newVideo.id] &&
      uploadManagerState[newVideo.id].status === UploadManagerStatus.SUCCESS
    ) {
      setIsUploading(false);
      history.push(`${videoPath}/${newVideo.id}`);
    }
  }, [history, newVideo?.id, uploadManagerState, videoPath]);

  return (
    <Fragment>
      {(errorVideo || errorPlaylist) && (
        <Box
          direction="row"
          align="center"
          justify="center"
          margin={{ bottom: 'medium' }}
          gap="small"
        >
          <Alert size="42rem" color="#df8c00" />
          <Text weight="bold" size="small">
            {intl.formatMessage(messages.Error)}
          </Text>
        </Box>
      )}
      <Form
        onSubmitError={() => ({})}
        onSubmit={({ value }) => createVideo(value)}
        onChange={(values) => {
          setVideo(values);
        }}
        messages={{
          required: intl.formatMessage(messages.requiredField),
        }}
        value={video}
      >
        <Box
          height={{ max: isDesktop ? '58vh' : '70vh' }}
          pad={{ vertical: 'xxsmall', horizontal: 'small' }}
          style={{
            overflow: 'auto',
            display: 'block',
          }}
        >
          <FormField
            label={intl.formatMessage(messages.titleLabel)}
            htmlFor="title-id"
            name="title"
            required
          >
            <TextInput size="1rem" name="title" id="title-id" />
          </FormField>

          {selectPlaylist}

          <FormField
            label={intl.formatMessage(messages.descriptionLabel)}
            htmlFor="description-id"
            name="description"
          >
            <TextArea
              size="1rem"
              rows={5}
              name="description"
              id="description-id"
            />
          </FormField>

          <UploadVideoForm
            onRetry={() => null}
            setVideoFile={(videoFile) =>
              setVideo((value) => ({
                ...value,
                videoFile: videoFile,
              }))
            }
            videoId={newVideo?.id}
            videoUploadState={newVideo?.upload_state}
          />

          <FormField
            label={intl.formatMessage(messages.licenseLabel)}
            htmlFor="select-license-id"
            name="license"
            required
            margin={{ vertical: 'small' }}
          >
            <LicenseSelect
              onChange={(option) =>
                setVideo((_video) => ({ ..._video, license: option.value }))
              }
            />
          </FormField>
        </Box>

        <ModalButton
          label={intl.formatMessage(messages.submitLabel)}
          onClickCancel={() => {
            history.push(videoPath);
          }}
          isSubmitting={isCreating}
          isDisabled={!video.videoFile || isUploading}
        />
      </Form>
    </Fragment>
  );
};

export default VideoCreateForm;

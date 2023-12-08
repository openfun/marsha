import { Button, Input } from '@openfun/cunningham-react';
import { Breakpoints, Nullable } from 'lib-common';
import {
  Box,
  Text,
  Video,
  WhiteCard,
  modelName,
  report,
  useResponsive,
  useUploadManager,
  useVideo,
} from 'lib-components';
import { uploadEnded } from 'lib-video';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { CurrentVideoProvider } from '@lib-video/hooks/useCurrentVideo';

import { LicenseSelect } from './LicenseSelect';
import { UploadVideoForm } from './UploadVideoForm';

const messages = defineMessages({
  videoCreationTitle: {
    defaultMessage: 'Video creation',
    description: 'Title of the view.',
    id: 'component.CreateVOD.videoCreationTitle',
  },
  descriptionText: {
    defaultMessage:
      'Use this wizard to create a new video, that you will be able to share with your students.',
    description: 'A paragraph presenting the actions below.',
    id: 'component.CreateVOD.descriptionText',
  },
  placeholderTitleInput: {
    defaultMessage: 'Enter title of your video here',
    description:
      'A placeholder text indicating the purpose of the input and what it is supposed to received.',
    id: 'components.CreateVOD.placeholderTitleInput',
  },
  goBackButtonLabel: {
    defaultMessage: 'Go back',
    description:
      "Button's label offering the user to go back to the last screen.",
    id: 'components.CreateVOD.goBackButtonLabel',
  },
  createVideoButtonLabel: {
    defaultMessage: 'Create a video',
    description:
      "Button's label offering the user to go validate is form and create a new video.",
    id: 'components.CreateVOD.createVideoButtonLabel',
  },
  updateVideoInfosFail: {
    defaultMessage: 'Video infos update has failed !',
    description: 'Message displayed when video infos update has failed.',
    id: 'component.CreateVOD.updateVideoInfosFail',
  },
});

enum FormState {
  WAITING_FOR_SUBMIT,
  UPDATING_METADATA,
  UPLOADING_VIDEO,
}

interface WizardedVideo {
  title: Video['title'];
  videoFile: Nullable<File>;
  license: Video['license'];
}

interface CreateVODProps {
  video: Video;
  onUploadSuccess: () => void;
  onPreviousButtonClick: () => void;
}

export const CreateVOD = ({
  video,
  onUploadSuccess,
  onPreviousButtonClick,
}: CreateVODProps) => {
  const currentVideo = useVideo((state) => state.getVideo(video));
  const intl = useIntl();
  const { isSmallerBreakpoint, breakpoint } = useResponsive();
  const [wizardedVideo, setWizardedVideo] = useState<WizardedVideo>({
    title: currentVideo.title,
    videoFile: null,
    license: null,
  });
  const [formState, setFormState] = useState<FormState>(
    FormState.WAITING_FOR_SUBMIT,
  );

  const { addUpload, uploadManagerState } = useUploadManager();

  const videoMutation = useUpdateVideo(currentVideo.id, {
    onSuccess: () => {
      setFormState(FormState.UPLOADING_VIDEO);
    },
    onError: (err) => {
      report(err);
      toast.error(intl.formatMessage(messages.updateVideoInfosFail), {
        position: 'top-center',
      });
      setFormState(FormState.WAITING_FOR_SUBMIT);
    },
  });

  const canValid =
    wizardedVideo.title &&
    wizardedVideo.title !== '' &&
    wizardedVideo.videoFile &&
    wizardedVideo.license &&
    wizardedVideo.license !== 'error';

  useEffect(() => {
    if (
      formState !== FormState.UPDATING_METADATA &&
      formState !== FormState.UPLOADING_VIDEO
    ) {
      return;
    }

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [formState]);

  useEffect(() => {
    if (formState !== FormState.UPLOADING_VIDEO) {
      return;
    }

    if (wizardedVideo.videoFile) {
      addUpload(
        modelName.VIDEOS,
        currentVideo.id,
        wizardedVideo.videoFile,
        undefined,
        (presignedPost) => {
          uploadEnded(currentVideo.id, presignedPost.fields['key']);
        },
      );
    }
  }, [formState, wizardedVideo.videoFile, currentVideo.id, addUpload]);

  useEffect(() => {
    if (
      uploadManagerState[currentVideo.id] &&
      uploadManagerState[currentVideo.id].progress === 100
    ) {
      onUploadSuccess();
    }
  }, [uploadManagerState, currentVideo, onUploadSuccess]);

  return (
    <CurrentVideoProvider value={currentVideo}>
      <WhiteCard title={intl.formatMessage(messages.videoCreationTitle)}>
        <Box
          gap="medium"
          margin={{
            horizontal: isSmallerBreakpoint(breakpoint, Breakpoints.large)
              ? 'medium'
              : 'xlarge',
          }}
        >
          <Text textAlign="center">
            {intl.formatMessage(messages.descriptionText)}
          </Text>

          <Input
            aria-label={intl.formatMessage(messages.placeholderTitleInput)}
            disabled={formState !== FormState.WAITING_FOR_SUBMIT}
            label={intl.formatMessage(messages.placeholderTitleInput)}
            onChange={(event) =>
              setWizardedVideo({
                ...wizardedVideo,
                title: event.target.value,
              })
            }
            value={wizardedVideo.title || ''}
            fullWidth
          />

          <UploadVideoForm
            onRetry={() => setFormState(FormState.WAITING_FOR_SUBMIT)}
            setVideoFile={(videoFile) =>
              setWizardedVideo({ ...wizardedVideo, videoFile })
            }
            videoId={currentVideo.id}
            videoUploadState={currentVideo.upload_state}
          />

          <LicenseSelect
            disabled={formState !== FormState.WAITING_FOR_SUBMIT}
            onChange={(option) =>
              setWizardedVideo({ ...wizardedVideo, license: option.value })
            }
          />
        </Box>

        <Box
          align="center"
          direction="row"
          justify="space-between"
          margin={{ horizontal: 'small', top: 'medium' }}
          gap="small"
        >
          <Button
            aria-label={intl.formatMessage(messages.goBackButtonLabel)}
            disabled={formState !== FormState.WAITING_FOR_SUBMIT}
            color="secondary"
            fullWidth
            style={{ flex: 1 }}
            title={intl.formatMessage(messages.goBackButtonLabel)}
            onClick={onPreviousButtonClick}
          >
            {intl.formatMessage(messages.goBackButtonLabel)}
          </Button>

          <Button
            aria-label={intl.formatMessage(messages.createVideoButtonLabel)}
            disabled={!canValid || formState !== FormState.WAITING_FOR_SUBMIT}
            fullWidth
            onClick={() => {
              setFormState(FormState.UPDATING_METADATA);

              videoMutation.mutate({
                title: wizardedVideo.title,
                license: wizardedVideo.license,
              });
            }}
            style={{ flex: 2 }}
            title={intl.formatMessage(messages.createVideoButtonLabel)}
          >
            {intl.formatMessage(messages.createVideoButtonLabel)}
          </Button>
        </Box>
      </WhiteCard>
    </CurrentVideoProvider>
  );
};

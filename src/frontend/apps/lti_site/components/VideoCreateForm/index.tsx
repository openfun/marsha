import { Box, Button, Form, Text, TextInput } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import {
  Spinner,
  modelName,
  UploadableObject,
  UploadField,
  UploadManagerStatus,
  useUploadManager,
} from 'lib-components';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import { useCreateVideo } from '../../data/queries';

import { MutationFieldError } from '../MutationFieldError';

const messages = defineMessages({
  createVideo: {
    defaultMessage: 'Create the video',
    description:
      'Button text for the button to submit the video creation form.',
    id: 'components.VideoCreateForm.createVideo',
  },
  playlistFieldEmpty: {
    defaultMessage: 'The playlist ID is required to create a new video.',
    description:
      'Error message when the playlist ID field is required and left empty in the video create form.',
    id: 'components.VideoCreateForm.playlistFieldEmpty',
  },
  step1Loading: {
    defaultMessage: 'Creating video...',
    description:
      'Accessible message for the spinner while creating a video in step 1.',
    id: 'components.VideoCreateForm.step1Loading',
  },
  step1Title: {
    defaultMessage: 'Video details',
    description: 'Title for the first step in the video creation form.',
    id: 'components.VideoCreateForm.step1Title',
  },
  step2Title: {
    defaultMessage: 'File selection',
    description: 'Title for the second step in the video creation form.',
    id: 'components.VideoCreateForm.step2Title',
  },
  step3Message: {
    defaultMessage: `You can use the file uploads manager to monitor ongoing uploads,
or go to the video page to start adding subtitles.`,
    description:
      'Helptext message for the processing part of the video create form.',
    id: 'components.VideoCreateForm.step3Message',
  },
  step3Subtitle: {
    defaultMessage: 'Video creation in progress',
    description: 'Subtitle for the processing part of the video create form.',
    id: 'components.VideoCreateForm.step3Subtitle',
  },
  step3Title: {
    defaultMessage: 'Processing',
    description: 'Title for the third step in the video creation form.',
    id: 'components.VideoCreateForm.step3Title',
  },
  stepCompleted: {
    defaultMessage: 'Completed: ',
    description:
      'Accessibility helper to mark completed steps in the video creation form.',
    id: 'components.VideoCreateForm.stepCompleted',
  },
  stepCurrent: {
    defaultMessage: 'Current: ',
    description:
      'Accessibility helper to mark completed steps in the video creation form.',
    id: 'components.VideoCreateForm.stepCurrent',
  },
  stepIndicatorTitle: {
    defaultMessage: 'Video creation progress',
    description:
      'Accessibility title for the video creation progress indicator widget.',
    id: 'components.VideoCreateForm.stepIndicatorTitle',
  },
  titleFieldEmpty: {
    defaultMessage: 'The title is required to create a new video.',
    description:
      'Error message when the title field left empty in the video create form.',
    id: 'components.VideoCreateForm.titleFieldEmpty',
  },
  videoLTIId: {
    defaultMessage: 'LTI ID',
    description: 'Label for the video LTI ID field in the video creation form.',
    id: 'components.VideoCreateForm.videoLTIId',
  },
  videoPlaylist: {
    defaultMessage: 'Playlist ID',
    description: 'Label for the playlist ID field in the video creation form.',
    id: 'components.VideoCreateForm.videoPlaylist',
  },
  videoTitle: {
    defaultMessage: 'Title',
    description: 'Label for the video title field in the video creation form.',
    id: 'components.VideoCreateForm.videoTitle',
  },
  createAnotherVideo: {
    defaultMessage: 'Create another video',
    description: 'Label button to create another video',
    id: 'components.VideoCreateForm.createAnotherVideo',
  },
});

const ProgressStep = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
`;

interface ProgressStepBarProps {
  isActive: boolean;
}

const ProgressStepBar = styled.div`
  position: absolute;
  width: 100%;
  height: 3px;
  top: 50%;
  transform: translateY(-50%);
  left: 50%;
  background: ${({ isActive }: ProgressStepBarProps) =>
    isActive
      ? normalizeColor('brand', theme)
      : normalizeColor('light-4', theme)};
`;

interface ProgressBulletProps {
  isActive: boolean;
}

const ProgressBullet = styled.div`
  position: relative;
  z-index: 1;
  height: 3.5rem;
  width: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;

  ${({ isActive }: ProgressBulletProps) =>
    `border: 3px solid ${
      isActive
        ? normalizeColor('brand', theme)
        : normalizeColor('light-4', theme)
    }`}
`;

interface VideoCreateFormStepIndicatorProps {
  step: 1 | 2 | 3;
}

const VideoCreateFormStepIndicator = ({
  step,
}: VideoCreateFormStepIndicatorProps) => {
  const intl = useIntl();

  return (
    <Box
      aria-label={intl.formatMessage(messages.stepIndicatorTitle)}
      as="ol"
      direction="row"
      width="large"
    >
      {[
        {
          stepNumber: 1,
          title: messages.step1Title,
        },
        {
          stepNumber: 2,
          title: messages.step2Title,
        },
        {
          stepNumber: 3,
          title: messages.step3Title,
        },
      ].map(({ stepNumber, title }) => (
        <Box
          key={stepNumber}
          aria-current={step === stepNumber ? 'step' : 'false'}
          aria-label={`
            ${
              step > stepNumber
                ? intl.formatMessage(messages.stepCompleted)
                : ''
            }${
            step === stepNumber ? intl.formatMessage(messages.stepCurrent) : ''
          } ${intl.formatMessage(title)} (${stepNumber}/3)
            `}
          as="li"
          flex="grow"
          align="center"
        >
          <Text
            color={step >= stepNumber ? 'brand' : 'black'}
            margin={{ bottom: 'small' }}
          >
            <FormattedMessage {...title} />
          </Text>
          <ProgressStep>
            <ProgressBullet isActive={step >= stepNumber}>
              <Text color={step >= stepNumber ? 'brand' : 'black'}>
                {stepNumber}
              </Text>
            </ProgressBullet>
            {stepNumber < 3 ? (
              <ProgressStepBar isActive={step > stepNumber} />
            ) : null}
          </ProgressStep>
        </Box>
      ))}
    </Box>
  );
};

interface VideoCreateFormStep1Props {
  onNextStep: (objectId: UploadableObject['id']) => void;
  playlist?: string;
}

const VideoCreateFormStep1 = ({
  onNextStep,
  playlist,
}: VideoCreateFormStep1Props) => {
  const [playlistFieldId] = useState(() => uuidv4());
  const [titleFieldId] = useState(() => uuidv4());

  const [isCleaned, setIsCleaned] = useState(false);
  const [playlistValue, setPlaylistValue] = useState('');
  const [titleValue, setTitleValue] = useState('');

  const mutation = useCreateVideo({
    onSuccess: (object) => onNextStep(object.id),
  });

  return (
    <Box direction="column" width="large" height="16rem" justify="center">
      <Form<{
        playlist?: string;
        title: string;
      }>
        onSubmit={({ value }) => {
          setIsCleaned(true);

          if (!!playlist || !!value.playlist) {
            mutation.mutate({
              ...value,
              playlist: playlist! || value.playlist!,
            });
          }
        }}
      >
        <Box direction="column" gap="medium">
          <Box direction="column" gap="xsmall">
            <label htmlFor={titleFieldId}>
              <Text weight="bold">
                <FormattedMessage {...messages.videoTitle} />
              </Text>
            </label>
            <TextInput
              id={titleFieldId}
              name="title"
              style={{ background: 'white' }}
              value={titleValue}
              onChange={(event) => setTitleValue(event.target.value)}
            />
            {isCleaned && !titleValue ? (
              <Text color="status-error">
                <FormattedMessage {...messages.titleFieldEmpty} />
              </Text>
            ) : null}
            {mutation.isError && mutation.error?.code === 'invalid' ? (
              <MutationFieldError
                errors={mutation.error.errors}
                fieldName="title"
              />
            ) : null}
          </Box>

          {!!playlist ? null : (
            <Box direction="column" gap="xsmall">
              <label htmlFor={playlistFieldId}>
                <Text weight="bold">
                  <FormattedMessage {...messages.videoPlaylist} />
                </Text>
              </label>
              <TextInput
                id={playlistFieldId}
                name="playlist"
                value={playlistValue}
                onChange={(event) => setPlaylistValue(event.target.value)}
              />
              {isCleaned && !playlist && !playlistValue ? (
                <Text color="status-error">
                  <FormattedMessage {...messages.playlistFieldEmpty} />
                </Text>
              ) : null}
              {mutation.isError && mutation.error?.code === 'invalid' ? (
                <MutationFieldError
                  errors={mutation.error.errors}
                  fieldName="playlist"
                />
              ) : null}
            </Box>
          )}

          <Button
            primary
            type="submit"
            alignSelf="end"
            style={{ cursor: mutation.isLoading ? 'progress' : 'pointer' }}
            label={
              <Box direction="row" align="center" gap="small">
                <FormattedMessage {...messages.createVideo} />
                {mutation.isLoading ? (
                  <Spinner size="small" color="white">
                    <FormattedMessage {...messages.step1Loading} />
                  </Spinner>
                ) : null}
              </Box>
            }
          />
        </Box>
      </Form>
    </Box>
  );
};

interface VideoCreateFormStep2Props {
  objectId: UploadableObject['id'];
  onNextStep: () => void;
}

const VideoCreateFormStep2 = ({
  objectId,
  onNextStep,
}: VideoCreateFormStep2Props) => {
  const { uploadManagerState } = useUploadManager();

  useEffect(() => {
    if (
      uploadManagerState[objectId]?.status === UploadManagerStatus.UPLOADING
    ) {
      onNextStep();
    }
  }, [uploadManagerState[objectId]?.status]);

  return (
    <Box direction="column" width="large" height="16rem" justify="center">
      <UploadField {...{ objectType: modelName.VIDEOS, objectId }} />
    </Box>
  );
};

interface VideoCreateFormStep3Props {
  onNextStep: () => void;
}

const VideoCreateFormStep3 = ({ onNextStep }: VideoCreateFormStep3Props) => {
  return (
    <Box
      direction="column"
      width="large"
      height="16rem"
      justify="center"
      pad={{ vertical: 'large' }}
      gap="medium"
    >
      <Text weight="bold">
        <FormattedMessage {...messages.step3Subtitle} />
      </Text>
      <Text>
        <FormattedMessage {...messages.step3Message} />
      </Text>
      <Box align="end">
        <Button
          primary
          onClick={() => onNextStep()}
          label={<FormattedMessage {...messages.createAnotherVideo} />}
        />
      </Box>
    </Box>
  );
};

interface VideoCreateFormProps {
  playlist?: string;
}

export const VideoCreateForm = ({ playlist }: VideoCreateFormProps) => {
  const [objectId, setObjectId] =
    useState<Nullable<UploadableObject['id']>>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  let formContent: JSX.Element;
  switch (step) {
    case 1:
      formContent = (
        <VideoCreateFormStep1
          onNextStep={(newObjectId) => {
            setObjectId(newObjectId);
            setStep(2);
          }}
          playlist={playlist}
        />
      );
      break;

    case 2:
      formContent = (
        <VideoCreateFormStep2
          objectId={objectId!}
          onNextStep={() => setStep(3)}
        />
      );
      break;

    case 3:
      formContent = (
        <VideoCreateFormStep3
          onNextStep={() => {
            setObjectId(null);
            setStep(1);
          }}
        />
      );
      break;
  }

  return (
    <Box
      pad="medium"
      gap="medium"
      border="all"
      align="center"
      background="light-1"
    >
      <VideoCreateFormStepIndicator step={step} />
      {formContent}
    </Box>
  );
};

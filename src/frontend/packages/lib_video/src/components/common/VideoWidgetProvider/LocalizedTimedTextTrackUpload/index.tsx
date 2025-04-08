import { Button } from '@openfun/cunningham-react';
import { Magic } from 'grommet-icons';
import { Maybe, Nullable, colorsTokens } from 'lib-common';
import {
  Box,
  ItemList,
  Text,
  TimedTextTrackState,
  actionOne,
  flags,
  formatSizeErrorScale,
  modelName,
  report,
  timedTextMode,
  uploadEnded,
  uploadState,
  useFlags,
  useTimedTextTrack,
  useUploadManager,
} from 'lib-components';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { createTimedTextTrack } from '@lib-video/api/createTimedTextTrack';
import { useTimedTextMetadata } from '@lib-video/api/useTimedTextMetadata';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import { LanguageChoice } from '@lib-video/types/SelectOptions';

import { LanguageSelect } from './LanguageSelect';
import { TimedTextTrackItem } from './TimedTextTrackItem';

const messages = defineMessages({
  noUploadFilesMessage: {
    defaultMessage: 'No uploaded files',
    description: 'Message displayed when there is no uploaded document.',
    id: 'components.UploadWidgetGeneric.noUploadFilesMessage',
  },
  uploadButtonLabel: {
    defaultMessage: 'Upload file',
    description: 'Label of the button used to upload the timed text file.',
    id: 'components.UploadWidgetGeneric.uploadButtonLabel',
  },
  errorFileTooLarge: {
    defaultMessage: 'Uploaded files exceeds allowed size of {uploadMaxSize}.',
    description: 'Error message when file is too big.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.errorFileTooLarge',
  },
  errorFileUpload: {
    defaultMessage: 'An error occurred when uploading your file. Please retry.',
    description: 'Error message when file upload fails.',
    id: 'apps.deposit.components.DashboardStudent.UploadFiles.errorFileUpload',
  },
  generateButtonLabel: {
    defaultMessage: 'Generate transcript',
    description:
      'Label of the button used to trigger the generation of the transcript.',
    id: 'components.UploadWidgetGeneric.generateButtonLabel',
  },
  transcriptMessage: {
    defaultMessage:
      "By clicking this button, a transcript will be automatically generated. The transcript's language will be the one detected in the video.",
    description: 'Message displayed for explaining the transcript generation.',
    id: 'components.UploadWidgetGeneric.transcriptMessage',
  },
});

interface UploadWidgetGenericProps {
  timedTextModeWidget: timedTextMode;
}

export const LocalizedTimedTextTrackUpload = ({
  timedTextModeWidget,
}: UploadWidgetGenericProps) => {
  const intl = useIntl();
  const video = useCurrentVideo();
  const { isFlagEnabled } = useFlags();
  const { addUpload, resetUpload, uploadManagerState } = useUploadManager();

  const timedTextTrackFn = useCallback(
    (state: TimedTextTrackState) => ({
      timedTextTracks: state.getTimedTextTracks(),
    }),
    [],
  );

  const { timedTextTracks } = useTimedTextTrack(timedTextTrackFn);
  const filteredTimedTextTracks = timedTextTracks.filter(
    (track) => track.mode === timedTextModeWidget,
  );
  const hiddenFileInput = useRef<Nullable<HTMLInputElement>>(null);
  const retryUploadIdRef = useRef<Nullable<string>>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<Nullable<LanguageChoice>>(null);
  const metadata = useTimedTextMetadata(video.id, intl.locale);
  const choices = useMemo(
    () =>
      metadata.data?.actions.POST.language.choices?.map((choice) => ({
        label: choice.display_name,
        value: choice.value,
      })),
    [metadata.data?.actions.POST.language.choices],
  );

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      let timedTextTrackId: string | undefined;
      const nativeEvent = event.nativeEvent.target as HTMLInputElement;
      if (event.target.files && event.target.files[0] && selectedLanguage) {
        try {
          if (!retryUploadIdRef.current) {
            const response = await createTimedTextTrack({
              language: selectedLanguage.value,
              mode: timedTextModeWidget,
              size: event.target.files[0].size,
              video: video.id,
            });
            timedTextTrackId = response.id;
          } else {
            timedTextTrackId = retryUploadIdRef.current;
            retryUploadIdRef.current = null;
          }
          addUpload(
            modelName.TIMEDTEXTTRACKS,
            timedTextTrackId,
            event.target.files[0],
            video.id,
            (presignedPost) => {
              uploadEnded(
                modelName.TIMEDTEXTTRACKS,
                timedTextTrackId as string,
                presignedPost.fields['key'],
                video.id,
              );
            },
          );
        } catch (error) {
          if ((error as object).hasOwnProperty('size') && metadata.data) {
            toast.error(
              intl.formatMessage(messages.errorFileTooLarge, {
                uploadMaxSize: formatSizeErrorScale(
                  metadata.data.upload_max_size_bytes,
                ),
              }),
            );
          } else {
            report(error);
            toast.error(intl.formatMessage(messages.errorFileUpload));
          }
        }
      }
      // We reset this value to allow handleChange to be triggered again on a new file upload
      // if it has the same name. More on this issue :
      // https://stackoverflow.com/questions/39484895/how-to-allow-input-type-file-to-select-the-same-file-in-react-component
      nativeEvent.value = '';
    },
    [
      addUpload,
      intl,
      metadata.data,
      selectedLanguage,
      timedTextModeWidget,
      video.id,
    ],
  );
  const onRetryFailedUpload = (timedTextTrackId: string) => {
    if (hiddenFileInput.current) {
      retryUploadIdRef.current = timedTextTrackId;
      hiddenFileInput.current.click();
    }
  };

  // When an upload is over and successful, it is deleted from the uploadManagerState, in order
  // to be able to perform a consecutive upload
  useEffect(() => {
    filteredTimedTextTracks.forEach((timedText) => {
      if (
        timedText.upload_state === uploadState.READY &&
        uploadManagerState[timedText.id]
      ) {
        resetUpload(timedText.id);
      }
    });
  }, [
    resetUpload,
    timedTextModeWidget,
    filteredTimedTextTracks,
    uploadManagerState,
  ]);

  const onChangeLanguageSelect = useCallback(
    (option: Maybe<LanguageChoice>) => setSelectedLanguage(option || null),
    [],
  );

  return (
    <Box gap="small" margin={{ top: 'small' }}>
      <LanguageSelect
        onChange={onChangeLanguageSelect}
        timedTextModeWidget={timedTextModeWidget}
        choices={choices}
      />

      <ItemList
        itemList={filteredTimedTextTracks}
        noItemsMessage={intl.formatMessage(messages.noUploadFilesMessage)}
      >
        {(timedTextTrack, index) => (
          <TimedTextTrackItem
            key={index}
            onRetryFailedUpload={onRetryFailedUpload}
            timedTextTrack={timedTextTrack}
            uploadingObject={Object.values(uploadManagerState).find(
              (uploadingObject) =>
                uploadingObject.objectId === timedTextTrack.id,
            )}
            choices={choices}
          />
        )}
      </ItemList>

      <input
        accept="application"
        data-testid="input-file-test-id"
        onChange={(event) => {
          handleChange(event);
        }}
        ref={hiddenFileInput}
        style={{ display: 'none' }}
        type="file"
      />
      <Button
        aria-label={intl.formatMessage(messages.uploadButtonLabel)}
        onClick={() => {
          if (hiddenFileInput.current) {
            retryUploadIdRef.current = null;
            hiddenFileInput.current.click();
          }
        }}
        fullWidth
        title={intl.formatMessage(messages.uploadButtonLabel)}
        disabled={!selectedLanguage}
      >
        {intl.formatMessage(messages.uploadButtonLabel)}
      </Button>

      {isFlagEnabled(flags.TRANSCRIPTION) &&
        video.upload_state === uploadState.READY &&
        timedTextModeWidget === timedTextMode.TRANSCRIPT &&
        filteredTimedTextTracks.length === 0 && (
          <Box
            align="center"
            style={{
              borderTop: `1px solid ${colorsTokens['info-500']}`,
            }}
            gap="small"
            pad={{ top: 'small' }}
          >
            <Box align="center" width="100%">
              <Text textAlign="center" size="medium">
                {intl.formatMessage(messages.transcriptMessage)}
              </Text>
            </Box>

            <Button
              aria-label={intl.formatMessage(messages.generateButtonLabel)}
              onClick={() => {
                actionOne({
                  name: 'videos',
                  id: video.id,
                  action: 'initiate-transcript',
                  method: 'POST',
                });
              }}
              fullWidth
              title={intl.formatMessage(messages.generateButtonLabel)}
              icon={<Magic color="white" size="20px" />}
              iconPosition="right"
            >
              {intl.formatMessage(messages.generateButtonLabel)}
            </Button>
          </Box>
        )}
    </Box>
  );
};

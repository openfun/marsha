import { Box, Button } from 'grommet';
import { Nullable } from 'lib-common';
import {
  ItemList,
  formatSizeErrorScale,
  modelName,
  report,
  timedTextMode,
  uploadState,
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
});

interface UploadWidgetGenericProps {
  timedTextModeWidget: timedTextMode;
}

export const LocalizedTimedTextTrackUpload = ({
  timedTextModeWidget,
}: UploadWidgetGenericProps) => {
  const intl = useIntl();
  const video = useCurrentVideo();
  const { addUpload, resetUpload, uploadManagerState } = useUploadManager();
  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );
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
      let timedTextTrackId;
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
    (option: LanguageChoice) => setSelectedLanguage(option),
    [],
  );

  return (
    <Box direction="column" gap="small" margin={{ top: 'small' }}>
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
        a11yTitle={intl.formatMessage(messages.uploadButtonLabel)}
        fill="horizontal"
        label={intl.formatMessage(messages.uploadButtonLabel)}
        onClick={() => {
          if (hiddenFileInput.current) {
            retryUploadIdRef.current = null;
            hiddenFileInput.current.click();
          }
        }}
        primary
        style={{ height: '50px', fontFamily: 'Roboto-Medium' }}
        title={intl.formatMessage(messages.uploadButtonLabel)}
      />
    </Box>
  );
};

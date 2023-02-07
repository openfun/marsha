import { Box, Button } from 'grommet';
import { Nullable } from 'lib-common';
import {
  ItemList,
  useUploadManager,
  useTimedTextTrack,
  modelName,
  timedTextMode,
  uploadState,
} from 'lib-components';
import React, { useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { createTimedTextTrack } from 'api/createTimedTextTrack';
import { LanguageChoice } from 'types/SelectOptions';

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
});

interface UploadWidgetGenericProps {
  timedTextModeWidget: timedTextMode;
}

export const LocalizedTimedTextTrackUpload = ({
  timedTextModeWidget,
}: UploadWidgetGenericProps) => {
  const intl = useIntl();
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

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let timedTextTrackId;
    const nativeEvent = event.nativeEvent.target as HTMLInputElement;
    if (event.target.files && event.target.files[0] && selectedLanguage) {
      if (!retryUploadIdRef.current) {
        const response = await createTimedTextTrack(
          selectedLanguage.value,
          timedTextModeWidget,
        );
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
    }
    // We reset this value to allow handleChange to be triggered again on a new file upload
    // if it has the same name. More on this issue :
    // https://stackoverflow.com/questions/39484895/how-to-allow-input-type-file-to-select-the-same-file-in-react-component
    nativeEvent.value = '';
  };

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

  return (
    <Box direction="column" gap="small" margin={{ top: 'small' }}>
      <LanguageSelect
        onChange={(option) => setSelectedLanguage(option)}
        timedTextModeWidget={timedTextModeWidget}
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

import { Box, Button } from 'grommet';
import React, { useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardLiveItemList } from 'components/DashboardLiveControlPane/customs/DashboardLiveItemList';
import { useUploadManager } from 'components/UploadManager';
import { createTimedTextTrack } from 'data/sideEffects/createTimedTextTrack';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import { LanguageChoice } from 'types/LanguageChoice';
import { modelName } from 'types/models';
import { timedTextMode, uploadState } from 'types/tracks';
import { Nullable } from 'utils/types';
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

export const UploadWidgetGeneric = ({
  timedTextModeWidget,
}: UploadWidgetGenericProps) => {
  const intl = useIntl();

  const { addUpload, resetUpload, uploadManagerState } = useUploadManager();
  const { getChoices } = useTimedTextTrackLanguageChoices((state) => state);
  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );

  const filteredTimedTextTracks = timedTextTracks.filter(
    (track) => track.mode === timedTextModeWidget,
  );

  useEffect(() => {
    getChoices();
  }, []);

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
  }, [filteredTimedTextTracks, resetUpload, uploadManagerState]);

  const hiddenFileInput = useRef<Nullable<HTMLInputElement>>(null);
  const retryUploadIdRef = useRef<Nullable<string>>(null);

  const [selectedLanguage, setSelectedLanguage] =
    useState<Nullable<LanguageChoice>>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let timedTextTrackId;
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
  };

  const onRetryFailedUpload = (timedTextTrackId: string) => {
    if (hiddenFileInput.current) {
      retryUploadIdRef.current = timedTextTrackId;
      hiddenFileInput.current.click();
    }
  };

  return (
    <Box direction="column" gap="small">
      <LanguageSelect
        onChange={(option) => setSelectedLanguage(option)}
        timedTextModeWidget={timedTextModeWidget}
      />

      <DashboardLiveItemList
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
      </DashboardLiveItemList>

      <input
        accept="application"
        data-testid="input-file-test-id"
        onChange={handleChange}
        ref={hiddenFileInput}
        style={{ display: 'none' }}
        type="file"
      />
      <Button
        a11yTitle={intl.formatMessage(messages.uploadButtonLabel)}
        color="blue-active"
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

import { Box, Button, Stack, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import {
  PictureSVG,
  ThumbnailDisplayer,
  useUploadManager,
  useAppConfig,
  useThumbnail,
  modelName,
  uploadState,
  report,
  formatSizeErrorScale,
  Loader,
  UploadManagerStatus,
  FoldableItem,
} from 'lib-components';
import React, { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { createThumbnail } from '@lib-video/api/createThumbnail';
import { useThumbnailMetadata } from '@lib-video/api/useThumbnailMetadata';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

import { ThumbnailManager } from './ThumbnailManager';
import { ThumbnailRemoveButton } from './ThumbnailRemoveButton';

const messages = defineMessages({
  title: {
    defaultMessage: 'Thumbnail',
    description: 'Title used in the thumbnail widget.',
    id: 'components.WidgetThumbnail.title',
  },
  infoLive: {
    defaultMessage:
      'This widget allows you to change the default thumbnail used for your live. The uploaded image should have a 16:9 ratio.',
    description: 'Helper explaining how to use the widget.',
    id: 'components.WidgetThumbnail.infoLive',
  },
  infoVOD: {
    defaultMessage:
      'This widget allows you to change the default thumbnail used for your VOD. The uploaded image should have a 16:9 ratio.',
    description: 'Helper explaining how to use the widget.',
    id: 'components.WidgetThumbnail.infoVOD',
  },
  uploadThumbnailButtonLabel: {
    defaultMessage: 'Upload an image',
    description: 'Label of the upload image button.',
    id: 'components.WidgetThumbnail.uploadThumbnailButtonLabel',
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

interface WidgetThumbnailProps {
  isLive?: boolean;
}

export const WidgetThumbnail = ({ isLive = true }: WidgetThumbnailProps) => {
  const appData = useAppConfig();
  const intl = useIntl();

  const video = useCurrentVideo();
  const { addUpload, uploadManagerState, resetUpload } = useUploadManager();
  const { addThumbnail, thumbnail } = useThumbnail((state) => ({
    addThumbnail: state.addResource,
    thumbnail: state.getThumbnail(),
  }));
  const hiddenFileInputRef = React.useRef<Nullable<HTMLInputElement>>(null);
  const { isLoading, data } = useThumbnailMetadata(intl.locale);

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        let thumbnailId;
        try {
          if (!thumbnail?.id) {
            const response = await createThumbnail({
              video: video.id,
              size: event.target.files[0].size,
            });
            addThumbnail(response);
            thumbnailId = response.id;
          } else {
            thumbnailId = thumbnail.id;
          }
          addUpload(modelName.THUMBNAILS, thumbnailId, event.target.files[0]);
        } catch (error) {
          if (
            (error as object).hasOwnProperty('size') &&
            data?.upload_max_size_bytes
          ) {
            toast.error(
              intl.formatMessage(messages.errorFileTooLarge, {
                uploadMaxSize: formatSizeErrorScale(data.upload_max_size_bytes),
              }),
            );
          } else {
            report(error);
            toast.error(intl.formatMessage(messages.errorFileUpload));
          }
        }
      }
    },
    [
      addThumbnail,
      addUpload,
      video.id,
      data?.upload_max_size_bytes,
      intl,
      thumbnail?.id,
    ],
  );

  // When an upload is over and successful, it is deleted from the uploadManagerState, in order
  // to be able to perform a consecutive upload
  useEffect(() => {
    if (
      thumbnail?.upload_state === uploadState.READY &&
      uploadManagerState[thumbnail.id]?.status === UploadManagerStatus.SUCCESS
    ) {
      resetUpload(thumbnail.id);
    }
  }, [thumbnail?.upload_state, resetUpload, uploadManagerState, thumbnail?.id]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <FoldableItem
      title={intl.formatMessage(messages.title)}
      infoText={
        isLive
          ? intl.formatMessage(messages.infoLive)
          : intl.formatMessage(messages.infoVOD)
      }
      initialOpenValue={true}
    >
      <Box direction="column" justify="center" gap="small">
        {!thumbnail ||
        (thumbnail && !thumbnail.urls && !uploadManagerState[thumbnail.id]) ? (
          <Box>
            <ThumbnailDisplayer
              rounded
              urlsThumbnail={{ 1080: appData.static.img.liveBackground }}
            />
          </Box>
        ) : (
          <Stack anchor="top-right">
            <Box>
              <ThumbnailManager
                thumbnail={thumbnail}
                uploadManagerState={uploadManagerState}
              />
            </Box>
            <ThumbnailRemoveButton thumbnail={thumbnail} />
          </Stack>
        )}

        <input
          accept="image/*"
          data-testid="input-file-test-id"
          onChange={(event) => {
            handleChange(event);
          }}
          ref={hiddenFileInputRef}
          style={{ display: 'none' }}
          type="file"
        />
        <Button
          color="blue-off"
          label={
            <Box
              align="center"
              direction="row"
              justify="between"
              pad="small"
              round="xsmall"
            >
              <Text
                color="blue-active"
                size="1rem"
                style={{ fontFamily: 'Roboto-Medium' }}
                truncate
              >
                {intl.formatMessage(messages.uploadThumbnailButtonLabel)}
              </Text>
              <PictureSVG height="24px" width="24px" iconColor="blue-active" />
            </Box>
          }
          onClick={() => {
            if (hiddenFileInputRef.current !== null) {
              hiddenFileInputRef.current.click();
            }
          }}
          secondary
          style={{
            background: normalizeColor('bg-select', theme),
            padding: '0px',
          }}
        />
      </Box>
    </FoldableItem>
  );
};

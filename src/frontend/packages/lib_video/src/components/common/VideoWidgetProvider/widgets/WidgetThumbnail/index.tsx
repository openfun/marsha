import { Button } from '@openfun/cunningham-react';
import { Stack } from 'grommet';
import { Nullable } from 'lib-common';
import {
  Box,
  BoxLoader,
  FoldableItem,
  PictureSVG,
  ThumbnailDisplayer,
  UploadManagerStatus,
  formatSizeErrorScale,
  modelName,
  report,
  uploadState,
  useAppConfig,
  useThumbnail,
  useUploadManager,
} from 'lib-components';
import React, { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { createThumbnail } from '@lib-video/api/createThumbnail';
import { thumbnailUploadEnded } from '@lib-video/api/thumbnailUploadEnded';
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
  const { isLoading, data } = useThumbnailMetadata(video.id, intl.locale);

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        let thumbnailId: string | undefined;
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
          addUpload(
            modelName.THUMBNAILS,
            thumbnailId,
            event.target.files[0],
            video.id,
            (presignedPost) => {
              thumbnailUploadEnded(
                video.id,
                thumbnailId as string,
                presignedPost.fields['key'],
              );
            },
          );
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
      {isLoading ? (
        <BoxLoader />
      ) : (
        <Box justify="center" gap="small">
          {!thumbnail ||
          (thumbnail &&
            !thumbnail.urls &&
            !uploadManagerState[thumbnail.id]) ? (
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
            fullWidth
            onClick={() => {
              if (hiddenFileInputRef.current !== null) {
                hiddenFileInputRef.current.click();
              }
            }}
            icon={<PictureSVG height="24px" width="24px" iconColor="white" />}
            iconPosition="right"
          >
            {intl.formatMessage(messages.uploadThumbnailButtonLabel)}
          </Button>
        </Box>
      )}
    </FoldableItem>
  );
};

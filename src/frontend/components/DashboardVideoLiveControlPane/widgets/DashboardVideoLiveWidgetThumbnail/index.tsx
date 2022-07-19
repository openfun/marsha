import { Box, Button, Stack, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';
import { PictureSVG } from 'components/SVGIcons/PictureSVG';
import { useUploadManager } from 'components/UploadManager';
import { createThumbnail } from 'data/sideEffects/createThumbnail';
import { useAppConfig } from 'data/stores/useAppConfig';
import { useThumbnail } from 'data/stores/useThumbnail';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import { theme } from 'utils/theme/theme';
import { Nullable } from 'utils/types';

import { ThumbnailManager } from './ThumbnailManager';
import { ThumbnailRemoveButton } from './ThumbnailRemoveButton/index';
import { ThumbnailDisplayer } from './ThumbnailDisplayer/index';

const messages = defineMessages({
  title: {
    defaultMessage: 'Thumbnail',
    description: 'Title used in the thumbnail widget.',
    id: 'components.DashboardVideoLiveWidgetThumbnail.title',
  },
  infoLive: {
    defaultMessage:
      'This widget allows you to change the default thumbnail used for your live. The uploaded image should have a 16:9 ratio.',
    description: 'Helper explaining how to use the widget.',
    id: 'components.DashboardVideoLiveWidgetThumbnail.infoLive',
  },
  infoVOD: {
    defaultMessage:
      'This widget allows you to change the default thumbnail used for your VOD. The uploaded image should have a 16:9 ratio.',
    description: 'Helper explaining how to use the widget.',
    id: 'components.DashboardVideoLiveWidgetThumbnail.infoVOD',
  },
  uploadThumbnailButtonLabel: {
    defaultMessage: 'Upload an image',
    description: 'Label of the upload image button.',
    id: 'components.DashboardVideoLiveWidgetThumbnail.uploadThumbnailButtonLabel',
  },
});

interface DashboardVideoLiveWidgetThumbnailProps {
  isLive?: boolean;
}

export const DashboardVideoLiveWidgetThumbnail = ({
  isLive = true,
}: DashboardVideoLiveWidgetThumbnailProps) => {
  const appData = useAppConfig();
  const intl = useIntl();

  const { addUpload, uploadManagerState, resetUpload } = useUploadManager();
  const { addThumbnail, thumbnail } = useThumbnail((state) => ({
    addThumbnail: state.addResource,
    thumbnail: state.getThumbnail(),
  }));
  const hiddenFileInputRef = React.useRef<Nullable<HTMLInputElement>>(null);

  // When an upload is over and successful, it is deleted from the uploadManagerState, in order
  // to be able to perform a consecutive upload
  useEffect(() => {
    if (
      thumbnail?.upload_state === uploadState.READY &&
      uploadManagerState[thumbnail.id]
    ) {
      resetUpload(thumbnail.id);
    }
  }, [thumbnail?.upload_state]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let id;
    if (!thumbnail) {
      const response = await createThumbnail();
      addThumbnail(response);
      id = response.id;
    } else {
      id = thumbnail.id;
    }
    if (event.target.files)
      addUpload(modelName.THUMBNAILS, id, event.target.files[0]);
  };
  return (
    <DashboardVideoLiveWidgetTemplate
      title={intl.formatMessage(messages.title)}
      infoText={
        isLive
          ? intl.formatMessage(messages.infoLive)
          : intl.formatMessage(messages.infoVOD)
      }
      initialOpenValue={true}
    >
      <Box direction={'column'} justify={'center'} gap="small">
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
            {thumbnail && thumbnail.is_ready_to_show && (
              <ThumbnailRemoveButton thumbnail={thumbnail} />
            )}
          </Stack>
        )}

        <input
          accept="image/*"
          data-testid="input-file-test-id"
          onChange={handleChange}
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
            if (hiddenFileInputRef.current !== null)
              hiddenFileInputRef.current.click();
          }}
          secondary
          style={{
            background: normalizeColor('bg-select', theme),
            padding: '0px',
          }}
        />
      </Box>
    </DashboardVideoLiveWidgetTemplate>
  );
};

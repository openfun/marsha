import { Box, Heading, Text } from 'grommet';
import {
  Crumb,
  UploadManagerState,
  UploadManagerStatus,
  useUploadManager,
  UploadableObjectProgress,
  UploadSVG,
} from 'lib-components';
import { useVideo } from 'lib-video';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  completedUploads: {
    defaultMessage: 'Completed uploads',
    description:
      'Title for the part of the view where completed uploads are displayed, if there are any.',
    id: 'components.UploadsView.completedUploads',
  },
  noOngoingUploads: {
    defaultMessage: 'There are no ongoing file uploads.',
    description:
      'Help message on the uploads view when there are no ongoing file uploads.',
    id: 'components.UploadsView.noOngoingUploads',
  },
  title: {
    defaultMessage: 'File uploads',
    description: 'Title for the file uploads view and its related breadcrumb',
    id: 'components.UploadsView.title',
  },
});

type UploadsListItemProps = {
  state: UploadManagerState[string];
  progress: number;
};

const UploadsListItem = ({ state, progress }: UploadsListItemProps) => {
  const { objectId, file } = state;
  const { data, status } = useVideo(objectId);

  return (
    <Box
      as="li"
      width="large"
      direction="row"
      pad="medium"
      gap="medium"
      background="light-1"
      border={{ color: 'light-6' }}
      align="center"
    >
      <Text color="dark-5">
        <UploadSVG iconColor="brand" />
      </Text>
      <Box direction="column" flex="grow" gap="small">
        {status === 'success' && !!data!.title ? (
          <div>
            <Text weight="bold">{data?.title}</Text>
            {' - '}
            {file.name}
          </div>
        ) : (
          <Text weight="bold">{file.name}</Text>
        )}
        <UploadableObjectProgress progress={progress} />
      </Box>
    </Box>
  );
};

export const UploadsView = () => {
  const { uploadManagerState } = useUploadManager();
  const uploadsDone = Object.values(uploadManagerState).filter(
    (state) => UploadManagerStatus.SUCCESS === state.status,
  );
  const uploadsInProgress = Object.values(uploadManagerState).filter((state) =>
    [UploadManagerStatus.INIT, UploadManagerStatus.UPLOADING].includes(
      state.status,
    ),
  );

  return (
    <React.Fragment>
      <Crumb title={<FormattedMessage {...messages.title} />} />
      <Box pad="large" gap="large">
        <Heading level={1}>
          <FormattedMessage {...messages.title} />
        </Heading>
        {uploadsInProgress.length > 0 ? (
          <Box as="ul" pad="none" gap="small">
            {uploadsInProgress.map((state) => (
              <UploadsListItem
                key={state.objectId}
                state={state}
                progress={uploadManagerState[state.objectId].progress}
              />
            ))}
          </Box>
        ) : (
          <Box pad={{ vertical: 'medium' }}>
            <FormattedMessage {...messages.noOngoingUploads} />
          </Box>
        )}

        {uploadsDone.length > 0 ? (
          <React.Fragment>
            <Heading level={2}>
              <FormattedMessage {...messages.completedUploads} />
            </Heading>
            <Box as="ul" pad="none" gap="small">
              {uploadsDone.map((state) => (
                <UploadsListItem
                  key={state.objectId}
                  state={state}
                  progress={uploadManagerState[state.objectId].progress}
                />
              ))}
            </Box>
          </React.Fragment>
        ) : null}
      </Box>
    </React.Fragment>
  );
};

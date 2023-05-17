import { Box, Button, Heading, Text } from 'grommet';
import {
  UploadManager,
  Modal,
  ModalButton,
  ButtonLoaderStyle,
  report,
} from 'lib-components';
import { useDeleteVideos } from 'lib-video';
import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { ContentsHeader } from 'features/Contents';
import { useSelectFeatures } from 'features/Contents/store/selectionStore';
import { routes } from 'routes';

import VideoCreateForm from './VideoCreateForm';

const messages = defineMessages({
  VideoTitle: {
    defaultMessage: 'Videos',
    description: 'Videos title',
    id: 'features.Contents.features.Video.Create.VideoTitle',
  },
  CreateVideoLabel: {
    defaultMessage: 'Create Video',
    description: 'Text heading create video.',
    id: 'features.Contents.features.Video.Create.CreateVideoLabel',
  },
  SelectButtonLabel: {
    defaultMessage: 'Select',
    description: 'Button label to select videos.',
    id: 'features.Contents.features.Video.Create.SelectButtonLabel',
  },
  DeleteButtonLabel: {
    defaultMessage: `Delete {item_count, plural,  =0 {0 video} one {# video} other {# videos}}`,
    description: 'Button label to delete single video.',
    id: 'features.Contents.features.Video.Create.DeleteButtonSingularLabel',
  },
  CancelSelectionLabel: {
    defaultMessage: 'Cancel',
    description: 'Button label to cancel video selection.',
    id: 'features.Contents.features.Video.Create.CancelSelectionLabel',
  },
  videosDeleteModalTitle: {
    defaultMessage: `Delete {item_count, plural, one {# video} other {# videos}}`,
    description: 'Title of the delete video modal.',
    id: 'features.Contents.features.Video.Create.videoDeleteModalTitle',
  },
  confirmDeleteVideosTitle: {
    defaultMessage: `Confirm delete {item_count, plural, one {# video} other {# videos}}`,
    description: 'Title of the widget used for delete video confirmation.',
    id: 'cfeatures.Contents.features.Video.Create.confirmDeleteVideoTitle',
  },
  confirmDeleteVideosText: {
    defaultMessage: `Are you sure you want to delete {item_count, plural, one {# video} other {# videos}} ? This action is irreversible.`,
    description: 'Text of the widget used for delete video confirmation.',
    id: 'features.Contents.features.Video.Create.confirmDeleteVideoText',
  },
  videosDeleteSuccess: {
    defaultMessage: `{item_count, plural,  =0 {0 video} one {# video} other {# videos}} successfully deleted`,
    description: 'Text of the delete video confirmation toast.',
    id: 'features.Contents.features.Video.Create.videoDeleteSuccess',
  },
  videosDeleteError: {
    defaultMessage: `Failed to delete {item_count, plural,  =0 {0 video} one {# video} other {# videos}}`,
    description: 'Text of the delete video error toast.',
    id: 'features.Contents.features.Video.Create.videoDeleteError',
  },
});

const ButtonStyled = styled(Button)`
  color: white;
`;

const VideoCreate = () => {
  const intl = useIntl();
  const history = useHistory();

  const videoRoute = routes.CONTENTS.subRoutes.VIDEO;
  const videoPath = videoRoute.path;
  const videoCreatePath = videoRoute.subRoutes?.CREATE?.path || '';
  const {
    isSelectionEnabled,
    switchSelectEnabled,
    resetSelection,
    selectedItems,
  } = useSelectFeatures();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const deleteVideos = useDeleteVideos({
    onSuccess: () => {
      toast.success(
        intl.formatMessage(messages.videosDeleteSuccess, {
          item_count: selectedItems.length,
        }),
        {
          position: 'bottom-center',
        },
      );
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(
        intl.formatMessage(messages.videosDeleteError, {
          item_count: selectedItems.length,
        }),
        {
          position: 'bottom-center',
        },
      );
    },
  });

  useEffect(() => {
    if (!isSelectionEnabled) {
      resetSelection();
    }
  }, [isSelectionEnabled, resetSelection]);

  return (
    <Fragment>
      <ContentsHeader>
        <Text size="large" weight="bold">
          {intl.formatMessage(messages.VideoTitle)}
        </Text>
        {!isSelectionEnabled && (
          <Box direction="row" gap="small">
            <Button
              secondary
              label={intl.formatMessage(messages.SelectButtonLabel)}
              onClick={switchSelectEnabled}
            />

            <Link to={videoCreatePath}>
              <Button
                primary
                label={intl.formatMessage(messages.CreateVideoLabel)}
                disabled={isSelectionEnabled}
              />
            </Link>
          </Box>
        )}
        {isSelectionEnabled && (
          <Box direction="row" gap="small">
            <Button
              secondary
              label={intl.formatMessage(messages.CancelSelectionLabel)}
              onClick={switchSelectEnabled}
            />

            <ButtonStyled
              primary
              color="action-danger"
              label={intl.formatMessage(messages.DeleteButtonLabel, {
                item_count: selectedItems.length,
              })}
              disabled={selectedItems.length < 1}
              onClick={() => setIsDeleteModalOpen(true)}
            />
          </Box>
        )}
      </ContentsHeader>
      <Switch>
        <Route path={videoCreatePath} exact>
          <Modal
            isOpen
            onClose={() => {
              history.push(videoPath);
            }}
          >
            <Heading
              level={2}
              margin={{ top: 'xxsmall' }}
              textAlign="center"
              weight="bold"
            >
              {intl.formatMessage(messages.CreateVideoLabel)}
            </Heading>
            <UploadManager>
              <VideoCreateForm />
            </UploadManager>
          </Modal>
        </Route>
      </Switch>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
      >
        <Heading
          size="3"
          alignSelf="center"
          margin={{ top: '0', bottom: 'small' }}
        >
          {intl.formatMessage(messages.videosDeleteModalTitle, {
            item_count: selectedItems.length,
          })}
        </Heading>
        <Text margin={{ top: 'small' }}>
          {intl.formatMessage(messages.confirmDeleteVideosText, {
            item_count: selectedItems.length,
          })}
        </Text>
        <ModalButton
          label={intl.formatMessage(messages.confirmDeleteVideosTitle, {
            item_count: selectedItems.length,
          })}
          onClickCancel={() => {
            setIsDeleteModalOpen(false);
          }}
          onClickSubmit={() => {
            deleteVideos.mutate({ ids: selectedItems });
            setIsDeleteModalOpen(false);
            switchSelectEnabled();
          }}
          style={ButtonLoaderStyle.DESTRUCTIVE}
        />
      </Modal>
    </Fragment>
  );
};

export default VideoCreate;

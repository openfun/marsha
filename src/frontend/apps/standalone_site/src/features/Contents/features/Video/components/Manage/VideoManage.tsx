import { Box, Button } from 'grommet';
import {
  ButtonLoaderStyle,
  Heading,
  Modal,
  ModalButton,
  Text,
  UploadManager,
  report,
} from 'lib-components';
import { useDeleteVideos } from 'lib-video';
import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ContentsHeader } from 'features/Contents';
import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import routes from '../../routes';

import VideoCreateForm from './VideoCreateForm';

const messages = defineMessages({
  VideoTitle: {
    defaultMessage: 'Videos',
    description: 'Videos title',
    id: 'features.Contents.features.Video.Manage.VideoTitle',
  },
  CreateVideoLabel: {
    defaultMessage: 'Create Video',
    description: 'Text heading create video.',
    id: 'features.Contents.features.Video.Manage.CreateVideoLabel',
  },
  SelectButtonLabel: {
    defaultMessage: 'Select',
    description: 'Button label to select videos.',
    id: 'features.Contents.features.Video.Manage.SelectButtonLabel',
  },
  DeleteButtonLabel: {
    defaultMessage: `Delete {item_count, plural,  =0 {0 video} one {# video} other {# videos}}`,
    description: 'Button label to delete single video.',
    id: 'features.Contents.features.Video.Manage.DeleteButtonSingularLabel',
  },
  CancelSelectionLabel: {
    defaultMessage: 'Cancel',
    description: 'Button label to cancel video selection.',
    id: 'features.Contents.features.Video.Manage.CancelSelectionLabel',
  },
  videosDeleteModalTitle: {
    defaultMessage: `Delete {item_count, plural, one {# video} other {# videos}}`,
    description: 'Title of the delete video modal.',
    id: 'features.Contents.features.Video.Manage.videoDeleteModalTitle',
  },
  confirmDeleteVideosTitle: {
    defaultMessage: `Confirm delete {item_count, plural, one {# video} other {# videos}}`,
    description: 'Title of the widget used for delete video confirmation.',
    id: 'cfeatures.Contents.features.Video.Manage.confirmDeleteVideoTitle',
  },
  confirmDeleteVideosText: {
    defaultMessage: `Are you sure you want to delete {item_count, plural, one {# video} other {# videos}} ? This action is irreversible.`,
    description: 'Text of the widget used for delete video confirmation.',
    id: 'features.Contents.features.Video.Manage.confirmDeleteVideoText',
  },
  videosDeleteSuccess: {
    defaultMessage: `{item_count, plural,  =0 {0 video} one {# video} other {# videos}} successfully deleted`,
    description: 'Text of the delete video confirmation toast.',
    id: 'features.Contents.features.Video.Manage.videoDeleteSuccess',
  },
  videosDeleteError: {
    defaultMessage: `Failed to delete {item_count, plural,  =0 {0 video} one {# video} other {# videos}}`,
    description: 'Text of the delete video error toast.',
    id: 'features.Contents.features.Video.Manage.videoDeleteError',
  },
});

const ButtonStyled = styled(Button)`
  color: white;
`;

const VideoManage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();

  const videoRoute = routes.VIDEO;
  const videoCreatePath = videoRoute.subRoutes.CREATE.path;
  const {
    isSelectionEnabled,
    switchSelectEnabled,
    resetSelection,
    selectedItems,
  } = useSelectFeatures();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const deleteVideos = useDeleteVideos({
    onSuccess: (_, variables) => {
      toast.success(
        intl.formatMessage(messages.videosDeleteSuccess, {
          item_count: variables.ids.length,
        }),
        {
          position: 'bottom-center',
        },
      );
    },
    onError: (err, variables) => {
      report(err);
      toast.error(
        intl.formatMessage(messages.videosDeleteError, {
          item_count: variables.ids.length,
        }),
        {
          position: 'bottom-center',
        },
      );
    },
  });

  useEffect(() => {
    return () => {
      resetSelection();
    };
  }, [resetSelection]);

  return (
    <Fragment>
      <ContentsHeader>
        <Heading level={3} className="m-0">
          {intl.formatMessage(messages.VideoTitle)}
        </Heading>
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
      {location.pathname.includes(videoCreatePath) && (
        <Modal
          isOpen
          onClose={() => {
            navigate('..');
          }}
        >
          <Heading level={2} textAlign="center" className="mt-0 mb-sl">
            {intl.formatMessage(messages.CreateVideoLabel)}
          </Heading>
          <UploadManager>
            <VideoCreateForm />
          </UploadManager>
        </Modal>
      )}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
      >
        <Heading level={2} textAlign="center" className="mt-st mb-b">
          {intl.formatMessage(messages.videosDeleteModalTitle, {
            item_count: selectedItems.length,
          })}
        </Heading>
        <Text className="mt-t">
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

export default VideoManage;

import { Button } from '@openfun/cunningham-react';
import {
  Box,
  Heading,
  Modal,
  ModalButton,
  Text,
  UploadManager,
  report,
  withLink,
} from 'lib-components';
import { useDeleteVideos } from 'lib-video';
import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

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

const ButtonWithLink = withLink(Button);

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
              color="secondary"
              aria-label={intl.formatMessage(messages.SelectButtonLabel)}
              onClick={switchSelectEnabled}
            >
              {intl.formatMessage(messages.SelectButtonLabel)}
            </Button>

            <ButtonWithLink
              to={videoCreatePath}
              aria-label={intl.formatMessage(messages.CreateVideoLabel)}
            >
              {intl.formatMessage(messages.CreateVideoLabel)}
            </ButtonWithLink>
          </Box>
        )}
        {isSelectionEnabled && (
          <Box direction="row" gap="small">
            <Button
              color="secondary"
              aria-label={intl.formatMessage(messages.CancelSelectionLabel)}
              onClick={switchSelectEnabled}
            >
              {intl.formatMessage(messages.CancelSelectionLabel)}
            </Button>
            <Button
              color="danger"
              aria-label={intl.formatMessage(messages.DeleteButtonLabel, {
                item_count: selectedItems.length,
              })}
              disabled={selectedItems.length < 1}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              {intl.formatMessage(messages.DeleteButtonLabel, {
                item_count: selectedItems.length,
              })}
            </Button>
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
          aria-label={intl.formatMessage(messages.confirmDeleteVideosTitle, {
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
          color="danger"
        >
          {intl.formatMessage(messages.confirmDeleteVideosTitle, {
            item_count: selectedItems.length,
          })}
        </ModalButton>
      </Modal>
    </Fragment>
  );
};

export default VideoManage;

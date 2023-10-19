import { Button } from '@openfun/cunningham-react';
import { Box } from 'grommet';
import {
  Heading,
  Modal,
  ModalButton,
  Text,
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

import LiveCreateForm from './LiveCreateForm';

const messages = defineMessages({
  WebinarTitle: {
    defaultMessage: 'Webinars',
    description: 'Webinars title',
    id: 'features.Contents.features.Webinar.Manage.WebinarTitle',
  },
  CreateWebinarLabel: {
    defaultMessage: 'Create Webinar',
    description: 'Text heading create webinar.',
    id: 'features.Contents.features.Webinar.Manage.CreateWebinarLabel',
  },
  SelectButtonLabel: {
    defaultMessage: 'Select',
    description: 'Button label to select webinars.',
    id: 'features.Contents.features.Webinar.Manage.SelectButtonLabel',
  },
  DeleteButtonLabel: {
    defaultMessage: `Delete {item_count, plural,  =0 {0 webinar} one {# webinar} other {# webinars}}`,
    description: 'Button label to delete webinar.',
    id: 'features.Contents.features.Webinar.Manage.DeleteButtonSingularLabel',
  },
  CancelSelectionLabel: {
    defaultMessage: 'Cancel',
    description: 'Button label to cancel webinar selection.',
    id: 'features.Contents.features.Webinar.Manage.CancelSelectionLabel',
  },
  webinarsDeleteModalTitle: {
    defaultMessage: `Delete {item_count, plural, one {# webinar} other {# webinars}}`,
    description: 'Title of the webinar delete modal.',
    id: 'features.Contents.features.Webinar.Manage.webinarDeleteModalTitle',
  },
  confirmDeleteWebinarsTitle: {
    defaultMessage: `Confirm delete {item_count, plural,  =0 {0 webinar} one {# webinar} other {# webinars}}`,
    description: 'Title of the widget used for webinar delete confirmation.',
    id: 'features.Contents.features.Webinar.Manage.confirmDeleteWebinarsTitle',
  },
  confirmDeleteWebinarsText: {
    defaultMessage: `Are you sure you want to delete {item_count, plural, one {# webinar} other {# webinars}} ? This action is irreversible.`,
    description: 'Text of the widget used for webinar delete confirmation.',
    id: 'features.Contents.features.Webinar.Manage.confirmDeleteWebinarsText',
  },
  webinarsDeleteSuccess: {
    defaultMessage: `{item_count, plural, one {# webinar} other {# webinars}} successfully deleted`,
    description: 'Text of the webinar delete confirmation toast.',
    id: 'features.Contents.features.Webinar.Manage.webinarsDeleteSuccess',
  },
  webinarsDeleteError: {
    defaultMessage: `Failed to delete {item_count, plural, one {# webinar} other {# webinars}}`,
    description: 'Text of the webinar delete error toast.',
    id: 'features.Contents.features.Webinar.Manage.webinarsDeleteError',
  },
});

const ButtonWithLink = withLink(Button);

const LiveManage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();

  const liveRoute = routes.LIVE;
  const liveCreatePath = liveRoute.subRoutes.CREATE.path;
  const {
    isSelectionEnabled,
    switchSelectEnabled,
    resetSelection,
    selectedItems,
  } = useSelectFeatures();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const deleteLives = useDeleteVideos({
    onSuccess: (_, variables) => {
      toast.success(
        intl.formatMessage(messages.webinarsDeleteSuccess, {
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
        intl.formatMessage(messages.webinarsDeleteError, {
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
          {intl.formatMessage(messages.WebinarTitle)}
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
              to={liveCreatePath}
              aria-label={intl.formatMessage(messages.CreateWebinarLabel)}
            >
              {intl.formatMessage(messages.CreateWebinarLabel)}
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
      {location.pathname.includes(liveCreatePath) && (
        <Modal
          isOpen
          onClose={() => {
            navigate('..');
          }}
        >
          <Heading level={2} textAlign="center" className="mt-0 mb-sl">
            {intl.formatMessage(messages.CreateWebinarLabel)}
          </Heading>
          <LiveCreateForm />
        </Modal>
      )}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
      >
        <Heading level={2} textAlign="center" className="mt-st mb-b">
          {intl.formatMessage(messages.webinarsDeleteModalTitle, {
            item_count: selectedItems.length,
          })}
        </Heading>
        <Text className="mt-t">
          {intl.formatMessage(messages.confirmDeleteWebinarsText, {
            item_count: selectedItems.length,
          })}
        </Text>
        <ModalButton
          aria-label={intl.formatMessage(messages.confirmDeleteWebinarsTitle, {
            item_count: selectedItems.length,
          })}
          onClickCancel={() => {
            setIsDeleteModalOpen(false);
          }}
          onClickSubmit={() => {
            deleteLives.mutate({ ids: selectedItems });
            setIsDeleteModalOpen(false);
            switchSelectEnabled();
          }}
          color="danger"
        >
          {intl.formatMessage(messages.confirmDeleteWebinarsTitle, {
            item_count: selectedItems.length,
          })}
        </ModalButton>
      </Modal>
    </Fragment>
  );
};

export default LiveManage;

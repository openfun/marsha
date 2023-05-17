import { Box, Button, Heading, Text } from 'grommet';
import { ButtonLoaderStyle, Modal, ModalButton, report } from 'lib-components';
import { useDeleteVideos } from 'lib-video';
import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { ContentsHeader } from 'features/Contents';
import { useSelectFeatures } from 'features/Contents/store/selectionStore';
import { routes } from 'routes';

import LiveCreateForm from './LiveCreateForm';

const messages = defineMessages({
  WebinarTitle: {
    defaultMessage: 'Webinars',
    description: 'Webinars title',
    id: 'features.Contents.features.Webinar.Create.WebinarTitle',
  },
  CreateWebinarLabel: {
    defaultMessage: 'Create Webinar',
    description: 'Text heading create webinar.',
    id: 'features.Contents.features.Webinar.Create.CreateWebinarLabel',
  },
  SelectButtonLabel: {
    defaultMessage: 'Select',
    description: 'Button label to select webinars.',
    id: 'features.Contents.features.Webinar.Create.SelectButtonLabel',
  },
  DeleteButtonLabel: {
    defaultMessage: `Delete {item_count, plural,  =0 {0 webinar} one {# webinar} other {# webinars}}`,
    description: 'Button label to delete webinar.',
    id: 'features.Contents.features.Webinar.Create.DeleteButtonSingularLabel',
  },
  CancelSelectionLabel: {
    defaultMessage: 'Cancel',
    description: 'Button label to cancel webinar selection.',
    id: 'features.Contents.features.Webinar.Create.CancelSelectionLabel',
  },
  webinarsDeleteModalTitle: {
    defaultMessage: `Delete {item_count, plural, one {# webinar} other {# webinars}}`,
    description: 'Title of the webinar delete modal.',
    id: 'features.Contents.features.Webinar.Create.webinarDeleteModalTitle',
  },
  confirmDeleteWebinarsTitle: {
    defaultMessage: `Confirm delete {item_count, plural,  =0 {0 webinar} one {# webinar} other {# webinars}}`,
    description: 'Title of the widget used for webinar delete confirmation.',
    id: 'features.Contents.features.Webinar.Create.confirmDeleteWebinarsTitle',
  },
  confirmDeleteWebinarsText: {
    defaultMessage: `Are you sure you want to delete {item_count, plural, one {# webinar} other {# webinars}} ? This action is irreversible.`,
    description: 'Text of the widget used for webinar delete confirmation.',
    id: 'features.Contents.features.Webinar.Create.confirmDeleteWebinarsText',
  },
  webinarsDeleteSuccess: {
    defaultMessage: `{item_count, plural, one {# webinar} other {# webinars}} successfully deleted`,
    description: 'Text of the webinar delete confirmation toast.',
    id: 'features.Contents.features.Webinar.Create.webinarsDeleteSuccess',
  },
  webinarsDeleteError: {
    defaultMessage: `Failed to delete {item_count, plural, one {# webinar} other {# webinars}}`,
    description: 'Text of the webinar delete error toast.',
    id: 'features.Contents.features.Webinar.Create.webinarsDeleteError',
  },
});

const ButtonStyled = styled(Button)`
  color: white;
`;

const LiveCreate = () => {
  const intl = useIntl();
  const history = useHistory();

  const liveRoute = routes.CONTENTS.subRoutes.LIVE;
  const livePath = liveRoute.path;
  const liveCreatePath = liveRoute.subRoutes?.CREATE?.path || '';
  const {
    isSelectionEnabled,
    switchSelectEnabled,
    resetSelection,
    selectedItems,
  } = useSelectFeatures();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const deleteLives = useDeleteVideos({
    onSuccess: () => {
      toast.success(
        intl.formatMessage(messages.webinarsDeleteSuccess, {
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
        intl.formatMessage(messages.webinarsDeleteError, {
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
          {intl.formatMessage(messages.WebinarTitle)}
        </Text>
        {!isSelectionEnabled && (
          <Box direction="row" gap="small">
            <Button
              secondary
              label={intl.formatMessage(messages.SelectButtonLabel)}
              onClick={switchSelectEnabled}
            />

            <Link to={liveCreatePath}>
              <Button
                primary
                label={intl.formatMessage(messages.CreateWebinarLabel)}
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
        <Route path={liveCreatePath} exact>
          <Modal
            isOpen
            onClose={() => {
              history.push(livePath);
            }}
          >
            <Heading
              level={2}
              margin={{ top: 'xxsmall' }}
              textAlign="center"
              weight="bold"
            >
              {intl.formatMessage(messages.CreateWebinarLabel)}
            </Heading>
            <LiveCreateForm />
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
          {intl.formatMessage(messages.webinarsDeleteModalTitle, {
            item_count: selectedItems.length,
          })}
        </Heading>
        <Text margin={{ top: 'small' }}>
          {intl.formatMessage(messages.confirmDeleteWebinarsText, {
            item_count: selectedItems.length,
          })}
        </Text>
        <ModalButton
          label={intl.formatMessage(messages.confirmDeleteWebinarsTitle, {
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
          style={ButtonLoaderStyle.DESTRUCTIVE}
        />
      </Modal>
    </Fragment>
  );
};

export default LiveCreate;

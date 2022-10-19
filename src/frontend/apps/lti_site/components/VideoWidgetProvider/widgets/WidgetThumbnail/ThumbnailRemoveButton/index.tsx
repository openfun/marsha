import { Button } from 'grommet';
import { BinSVG } from 'lib-components';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { ConfirmationModal } from 'components/graphicals/ConfirmationModal';
import { useDeleteThumbnail } from 'data/queries';
import { useThumbnail } from 'data/stores/useThumbnail';
import { Thumbnail } from 'lib-components';
import { report } from 'lib-components';

const messages = defineMessages({
  confirmationModalTitle: {
    defaultMessage: 'Delete thumbnail image',
    description:
      'Title of the modal displayed when an instructor wants to delete the live video thumbnail.',
    id: 'components.ThumbnailRemoveButton.confirmationModalTitle',
  },
  confirmationModalText: {
    defaultMessage:
      'Are you sure you want to delete the actual thumbnail ? Default thumbnail will be displayed instead.',
    description:
      'Title of the modal displayed when an instructor wants to delete the live video thumbnail.',
    id: 'component.ThumbnailRemoveButton.confirmationModalText',
  },
  deleteThumbnailSuccessMessage: {
    defaultMessage: 'Thumbnail successfully deleted.',
    description: 'Message displayed when a thumbnail is successfully deleted.',
    id: 'components.ThumbnailRemoveButton.deleteThumbnailSuccessMessage',
  },
  deleteThumbnailFailMessage: {
    defaultMessage: 'Thumbnail deletion failed !',
    description: 'Message displayed when a thumbnail failed to be deleted.',
    id: 'components.ThumbnailRemoveButton.deleteThumbnailFailMessage',
  },
  deleteButtonLabel: {
    defaultMessage: 'Delete thumbnail',
    description: 'The label of the delete thumbnail button',
    id: 'components.ThumbnailRemoveButton.deleteButtonLabel',
  },
});

interface ThumbnailRemoveButtonProps {
  thumbnail: Thumbnail;
}

export const ThumbnailRemoveButton = ({
  thumbnail,
}: ThumbnailRemoveButtonProps) => {
  const intl = useIntl();

  const { removeThumbnail } = useThumbnail((state) => ({
    removeThumbnail: state.removeResource,
  }));
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] =
    useState(false);

  const thumbnailDelete = useDeleteThumbnail({
    onSuccess: () => {
      toast.success(
        intl.formatMessage(messages.deleteThumbnailSuccessMessage),
        {
          position: 'bottom-center',
        },
      );
      removeThumbnail(thumbnail!);
      setShowDeleteConfirmationModal(false);
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(intl.formatMessage(messages.deleteThumbnailFailMessage), {
        position: 'bottom-center',
      });
    },
  });

  return (
    <React.Fragment>
      {showDeleteConfirmationModal && (
        <ConfirmationModal
          text={intl.formatMessage(messages.confirmationModalText)}
          title={intl.formatMessage(messages.confirmationModalTitle)}
          onModalCloseOrCancel={() => setShowDeleteConfirmationModal(false)}
          onModalConfirm={() => {
            thumbnailDelete.mutate(thumbnail.id);
          }}
        />
      )}
      <Button
        a11yTitle={intl.formatMessage(messages.deleteButtonLabel)}
        icon={<BinSVG width="14px" height="18px" iconColor="blue-active" />}
        onClick={() => setShowDeleteConfirmationModal(true)}
        plain
        title={intl.formatMessage(messages.deleteButtonLabel)}
      />
    </React.Fragment>
  );
};

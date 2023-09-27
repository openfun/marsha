import { Button } from 'grommet';
import {
  BinSVG,
  ButtonLoaderStyle,
  Modal,
  ModalButton,
  ModalControlMethods,
  Text,
  Thumbnail,
  report,
  useThumbnail,
} from 'lib-components';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useDeleteThumbnail } from '@lib-video/api/useDeleteThumbnail';

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
  const modalActions = useRef<ModalControlMethods>(null);
  const thumbnailDelete = useDeleteThumbnail({
    onSuccess: () => {
      toast.success(
        intl.formatMessage(messages.deleteThumbnailSuccessMessage),
        {
          position: 'bottom-center',
        },
      );
      removeThumbnail(thumbnail);
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
      <Modal controlMethods={modalActions}>
        <Text className="mt-s">
          {intl.formatMessage(messages.confirmationModalText)}
        </Text>
        <ModalButton
          label={intl.formatMessage(messages.confirmationModalTitle)}
          onClickCancel={() => modalActions.current?.close()}
          onClickSubmit={() =>
            thumbnailDelete.mutate({
              videoId: thumbnail.video,
              thumbnailId: thumbnail.id,
            })
          }
          style={ButtonLoaderStyle.DESTRUCTIVE}
        />
      </Modal>
      {thumbnail && thumbnail.is_ready_to_show && (
        <Button
          a11yTitle={intl.formatMessage(messages.deleteButtonLabel)}
          icon={<BinSVG width="14px" height="18px" iconColor="blue-active" />}
          onClick={() => modalActions.current?.open()}
          plain
          title={intl.formatMessage(messages.deleteButtonLabel)}
          margin="small"
        />
      )}
    </React.Fragment>
  );
};

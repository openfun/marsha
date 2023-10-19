import { defineMessages, useIntl } from 'react-intl';

import { Heading } from '../Headings';
import { Modal, ModalButton } from '../Modal';
import { Text } from '../Text';

const messages = defineMessages({
  confirmButtonLabel: {
    defaultMessage: 'Confirm',
    description: 'Label of the confirming button',
    id: 'components.ConfirmationModal.confirmButtonLabel',
  },
  cancelButtonLabel: {
    defaultMessage: 'Cancel',
    description: 'Label of the cancelling button',
    id: 'components.ConfirmationModal.cancelButtonLabel',
  },
});

interface ConfirmationModalProps {
  text: string;
  title: string;
  onModalCloseOrCancel: () => void;
  onModalConfirm: () => void;
  color?: string;
}

export const ConfirmationModal = ({
  text,
  title,
  onModalCloseOrCancel,
  onModalConfirm,
}: ConfirmationModalProps) => {
  const intl = useIntl();

  return (
    <Modal isOpen onClose={onModalCloseOrCancel}>
      <Heading level={2} textAlign="center" className="mt-0 mb-s">
        {title}
      </Heading>
      <Text className="mt-t">{text}</Text>
      <ModalButton
        aria-label={intl.formatMessage(messages.confirmButtonLabel)}
        onClickCancel={onModalCloseOrCancel}
        onClickSubmit={onModalConfirm}
        color="danger"
      >
        {intl.formatMessage(messages.confirmButtonLabel)}
      </ModalButton>
    </Modal>
  );
};

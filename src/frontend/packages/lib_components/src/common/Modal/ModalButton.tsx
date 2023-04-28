import { Box, BoxProps, Button } from 'grommet';
import { PropsWithChildren } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ButtonLoader, ButtonLoaderStyle } from '@lib-components/common/';

export const ModalButtonContainer = ({
  children,
  ...props
}: PropsWithChildren<BoxProps>) => {
  return (
    <Box
      direction="row"
      justify="around"
      gap="medium"
      margin={{ top: 'large' }}
      {...props}
    >
      {children}
    </Box>
  );
};

const messages = defineMessages({
  ButtonCancelModal: {
    defaultMessage: 'Cancel',
    description: 'Label for cancel button in modal.',
    id: 'components.Modal.ButtonCancelModal',
  },
});

interface ButtonModalProps {
  flex?: string | number;
}
const ButtonModal = styled(Button)<ButtonModalProps>`
  flex: ${({ flex }) => flex && `${flex}`};
`;

interface ModalButtonProps {
  label: string;
  labelCancel?: string;
  isDisabled?: boolean;
  isSubmitting?: boolean;
  onClickSubmit?: () => void;
  onClickCancel?: () => void;
  style?: ButtonLoaderStyle;
}

/**
 * @param ModalButtonProps -
 *  - isDisabled will deactivate the submit button
 *  - isSubmitting will deactivate the submit button and add a loader above it
 *  - init onClickSubmit switch the button from type submit to type button
 *  - init onClickCancel will display the cancel button
 * @returns ModalButton component
 */
const ModalButton = ({
  labelCancel,
  onClickCancel,
  ...buttonLabelProps
}: ModalButtonProps) => {
  const intl = useIntl();
  return (
    <ModalButtonContainer>
      {onClickCancel && (
        <ButtonModal
          label={labelCancel || intl.formatMessage(messages.ButtonCancelModal)}
          onClick={onClickCancel}
          flex={1}
        />
      )}
      <ButtonLoader {...buttonLabelProps} />
    </ModalButtonContainer>
  );
};

export default ModalButton;

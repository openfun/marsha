import { Box, BoxProps, Button, Stack } from 'grommet';
import { PropsWithChildren } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Spinner } from '@lib-components/common';

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

export enum ModalButtonStyle {
  DEFAULT = 'DEFAULT',
  DESTRUCTIVE = 'DESTRUCTIVE',
}

interface ModalButtonProps {
  label: string;
  labelCancel?: string;
  isDisabled?: boolean;
  isSubmitting?: boolean;
  onClickSubmit?: () => void;
  onClickCancel?: () => void;
  style?: ModalButtonStyle;
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
  label,
  labelCancel,
  isDisabled,
  isSubmitting,
  onClickSubmit,
  onClickCancel,
  style,
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
      <Stack
        style={{ flex: '3' }}
        guidingChild="first"
        interactiveChild="first"
      >
        <ButtonModal
          type={onClickSubmit ? 'button' : 'submit'}
          disabled={isDisabled || isSubmitting}
          primary
          label={label}
          onClick={onClickSubmit}
          fill="horizontal"
          color={
            style === ModalButtonStyle.DESTRUCTIVE ? 'red-active' : undefined
          }
        />
        {isSubmitting && (
          <Box fill>
            <Box margin="auto">
              <Spinner />
            </Box>
          </Box>
        )}
      </Stack>
    </ModalButtonContainer>
  );
};

export default ModalButton;

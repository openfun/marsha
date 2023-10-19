import { Button } from '@openfun/cunningham-react';
import { Box, BoxProps } from 'grommet';
import { PropsWithChildren } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ButtonLoader, ButtonLoaderProps } from '@lib-components/common/';

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

interface ModalButtonProps extends ButtonLoaderProps {
  labelCancel?: string;
  onClickCancel?: () => void;
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
        <Button
          aria-label={
            labelCancel || intl.formatMessage(messages.ButtonCancelModal)
          }
          color="secondary"
          onClick={onClickCancel}
          style={{ flex: '1' }}
          fullWidth
        >
          {labelCancel || intl.formatMessage(messages.ButtonCancelModal)}
        </Button>
      )}
      <ButtonLoader {...buttonLabelProps} />
    </ModalButtonContainer>
  );
};

export default ModalButton;

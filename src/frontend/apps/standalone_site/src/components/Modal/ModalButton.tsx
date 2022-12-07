import { Box, Button, Stack } from 'grommet';
import { Spinner } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

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
  isDisabled?: boolean;
  isSubmiting?: boolean;
  onClickSubmit?: () => void;
  onClickCancel?: () => void;
}

/**
 * @param ModalButtonProps -
 *  - isDisabled will deactive the submit button
 *  - isSubmiting will deactive the submit button and add a loader above it
 *  - init onClickSubmit switch the button from type submit to type button
 *  - init onClickCancel will display the cancel button
 * @returns ModalButton component
 */
const ModalButton = ({
  label,
  isDisabled,
  isSubmiting,
  onClickSubmit,
  onClickCancel,
}: ModalButtonProps) => {
  const intl = useIntl();
  return (
    <Box
      direction="row"
      justify="around"
      gap="medium"
      margin={{ top: 'large' }}
    >
      {onClickCancel && (
        <ButtonModal
          primary
          label={intl.formatMessage(messages.ButtonCancelModal)}
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
          disabled={isDisabled || isSubmiting}
          primary
          label={label}
          onClick={onClickSubmit}
          fill="horizontal"
        />
        {isSubmiting && (
          <Box fill>
            <Box margin="auto">
              <Spinner />
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default ModalButton;

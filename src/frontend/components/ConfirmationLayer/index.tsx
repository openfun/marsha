import React, { MouseEventHandler } from 'react';
import { Box, Button, Layer, Text } from 'grommet';
import { KeyboardEventHandler } from 'react-select';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  confirmation: {
    defaultMessage: 'Ok',
    description: 'Label for the confirmation button',
    id: 'components.ConfirmationLayer.Confirmation',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Label for the cancel button',
    id: 'components.ConfirmationLayer.Cancel',
  },
});

interface ConfirmationLayerProps {
  confirmationLabel: JSX.Element;
  onConfirm: MouseEventHandler;
  onCancel: KeyboardEventHandler | MouseEventHandler;
}

export const ConfirmationLayer = ({
  confirmationLabel,
  onCancel,
  onConfirm,
}: ConfirmationLayerProps) => {
  const intl = useIntl();
  return (
    <Layer
      position="center"
      onClickOutside={onCancel as MouseEventHandler}
      onEsc={onCancel as KeyboardEventHandler}
    >
      <Box pad="large" gap="medium">
        <Text>{confirmationLabel}</Text>
        <Box align="center" direction="row" gap="medium">
          <Button
            label={intl.formatMessage(messages.confirmation)}
            onClick={onConfirm}
            primary={true}
          />
          <Button
            label={intl.formatMessage(messages.cancel)}
            onClick={onCancel as MouseEventHandler}
          />
        </Box>
      </Box>
    </Layer>
  );
};

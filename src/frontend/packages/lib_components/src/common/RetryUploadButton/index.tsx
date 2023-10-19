import { Button } from '@openfun/cunningham-react';
import { FormRefresh, IconProps } from 'grommet-icons';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled, { keyframes } from 'styled-components';

const messages = defineMessages({
  buttonLabel: {
    defaultMessage:
      'Click on this button to retry uploading your failed upload.',
    description: 'The label of the retry button.',
    id: 'component.RetryUploadButton.buttonLabel',
  },
});

const rotate = keyframes`
from {
  transform: rotate(0deg);
}
to {
    transform: rotate(360deg);
}
`;

const StyledRetryUploadButton = styled(Button)`
  padding: 0;
  margin-right: -4px;
  :hover {
    transform: scale(1.1, 1.1);
    background-color: transparent;
  }
  :focus {
    animation: ${rotate} 0.3s linear forwards;
  }
  :active {
    animation: none;
  }
`;

interface RetryUploadButtonProps {
  color: string;
  onClick: () => void;
  size?: IconProps['size'];
}

export const RetryUploadButton = ({
  color,
  onClick,
  size,
}: RetryUploadButtonProps) => {
  const intl = useIntl();
  return (
    <React.Fragment>
      <StyledRetryUploadButton
        color="tertiary"
        aria-label={intl.formatMessage(messages.buttonLabel)}
        icon={<FormRefresh color={color} size={size} />}
        onClick={onClick}
        title={intl.formatMessage(messages.buttonLabel)}
      />
    </React.Fragment>
  );
};

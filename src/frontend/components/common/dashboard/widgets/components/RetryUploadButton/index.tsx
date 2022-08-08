import { Button } from 'grommet';
import { FormRefresh } from 'grommet-icons';
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
  }
  :focus {
    animation: ${rotate} 0.3s linear forwards;
  }
  :active {
    animation: none;
  }
`;

interface RetryUploadButtonProps {
  onClick: () => void;
}

export const RetryUploadButton = ({ onClick }: RetryUploadButtonProps) => {
  const intl = useIntl();
  return (
    <StyledRetryUploadButton
      a11yTitle={intl.formatMessage(messages.buttonLabel)}
      justify="center"
      fill={false}
      icon={<FormRefresh color="red-active" />}
      onClick={onClick}
      plain
      title={intl.formatMessage(messages.buttonLabel)}
    />
  );
};

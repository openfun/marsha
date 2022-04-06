import { Button, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  align-items: center;
  display: flex;
  height: 20px;
  padding: 0px 10px;
`;

const StyledTextButton = styled(Text)`
  color: white;
  font-family: 'Roboto-Bold';
`;

interface ViewersListTextButtonProps {
  onClick: () => void;
  text: string;
}

export const ViewersListTextButton = ({
  onClick,
  text,
}: ViewersListTextButtonProps) => {
  return (
    <StyledButton
      a11yTitle={text}
      color="blue-active"
      label={<StyledTextButton size="0.625rem">{text}</StyledTextButton>}
      onClick={onClick}
      primary
      title={text}
    />
  );
};

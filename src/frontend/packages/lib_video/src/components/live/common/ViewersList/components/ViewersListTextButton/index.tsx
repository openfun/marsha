import { Button } from 'grommet';
import { Text } from 'lib-components';
import React from 'react';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  align-items: center;
  display: flex;
  height: 20px;
  padding: 0px 10px;
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
      label={
        <Text size="small" weight="bold" color="white">
          {text}
        </Text>
      }
      onClick={onClick}
      primary
      title={text}
    />
  );
};

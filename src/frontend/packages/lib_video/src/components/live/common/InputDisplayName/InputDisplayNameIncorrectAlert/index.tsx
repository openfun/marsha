import { Box, Text } from 'grommet';
import React from 'react';

interface InputDisplayNameIncorrectAlertProps {
  alertMsg: string;
}

export const InputDisplayNameIncorrectAlert = ({
  alertMsg,
}: InputDisplayNameIncorrectAlertProps) => {
  return (
    <Box pad="1px">
      <Text color="accent-2" size="0.688rem">
        {alertMsg}
      </Text>
    </Box>
  );
};

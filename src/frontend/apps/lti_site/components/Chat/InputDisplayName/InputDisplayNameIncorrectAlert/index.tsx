import { Box, Text } from 'grommet';
import React from 'react';

interface InputDisplayNameIncorrectAlert {
  alertMsg: string;
}

export const InputDisplayNameIncorrectAlert = ({
  alertMsg,
}: InputDisplayNameIncorrectAlert) => {
  return (
    <Box pad="1px">
      <Text color="accent-2" size="0.688rem">
        {alertMsg}
      </Text>
    </Box>
  );
};

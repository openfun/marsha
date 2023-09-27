import { Box } from 'grommet';
import { Text } from 'lib-components';
import React from 'react';

interface InputDisplayNameIncorrectAlertProps {
  alertMsg: string;
}

export const InputDisplayNameIncorrectAlert = ({
  alertMsg,
}: InputDisplayNameIncorrectAlertProps) => {
  return (
    <Box pad="1px">
      <Text color="clr-danger-300" size="tiny">
        {alertMsg}
      </Text>
    </Box>
  );
};

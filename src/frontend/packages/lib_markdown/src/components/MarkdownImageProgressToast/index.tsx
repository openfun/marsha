import { Meter, Stack } from 'grommet';
import { Box, Text } from 'lib-components';
import React from 'react';

interface MarkdownImageProgressToastProps {
  filename: string;
  progress: number;
}

export const MarkdownImageProgressToast = ({
  filename,
  progress,
}: MarkdownImageProgressToastProps) => {
  const progressPercent = `${progress}%`;

  return (
    <Box gap="small">
      <Text truncate>{filename}</Text>
      <Box align="center" pad="none">
        <Stack anchor="center">
          <Meter
            values={[
              {
                color: 'brand',
                label: progressPercent,
                value: progress,
              },
            ]}
          />
          <Text weight="bold">{progressPercent}</Text>
        </Stack>
      </Box>
    </Box>
  );
};

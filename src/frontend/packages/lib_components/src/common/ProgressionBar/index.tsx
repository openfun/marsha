import { Box, Meter } from 'grommet';

import { Text } from '../Text';

interface ProgressionBarProps {
  progressPercentage: number;
}

export const ProgressionBar = ({ progressPercentage }: ProgressionBarProps) => {
  return (
    <Box direction="row" style={{ position: 'relative' }}>
      <Meter round size="xlarge" type="bar" value={progressPercentage} />
      <Text
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        color={progressPercentage < 48 ? undefined : 'white'}
        size="small"
      >
        {progressPercentage} %
      </Text>
    </Box>
  );
};

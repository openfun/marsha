import { Text } from '@lib-components/common/Text';
import { Box } from 'grommet';
import { AppData } from 'lib-components';

type WarningsProps = {
  warnings: AppData['warnings'];
};

export const Warnings = ({ warnings }: WarningsProps) => {
  if (!warnings) {
    return null;
  }

  return (
    <Box background="status-warning" pad="small" margin={{ bottom: 'small' }}>
      {warnings.map((warning, index) => (
        <Text textAlign="center" key={index}>
          {warning}
        </Text>
      ))}
    </Box>
  );
};

import { colorsTokens } from '@lib-common/cunningham';
import { Text } from '@lib-components/common/Text';
import { AppData, Box } from 'lib-components';

type WarningsProps = {
  warnings: AppData['warnings'];
};

export const Warnings = ({ warnings }: WarningsProps) => {
  if (!warnings) {
    return null;
  }

  return (
    <Box
      background={colorsTokens['warning-500']}
      pad="small"
      margin={{ bottom: 'small' }}
    >
      {warnings.map((warning, index) => (
        <Text textAlign="center" key={index}>
          {warning}
        </Text>
      ))}
    </Box>
  );
};

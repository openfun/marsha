import { Box, Meter, MeterProps, Text } from 'grommet';
import React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';

const messages = defineMessages({
  progressLabel: {
    defaultMessage: 'Upload progress',
    description: 'Accessibility message for the upload progress bar.',
    id: 'components.DashboardVideoPaneProgress.progressLabel',
  },
});

interface DashboardVideoPaneProgressProps {
  progress: number;
}

export const DashboardVideoPaneProgress = injectIntl(
  ({
    intl,
    progress = 0,
  }: DashboardVideoPaneProgressProps & InjectedIntlProps) => {
    // There is a conflict in the type of the `values` prop between `react` and `grommet`
    // Use the const type to ensure correctness and the `any` escape hatch for the actual value
    const values: MeterProps['values'] = [
      { color: 'brand', label: `${progress}%`, value: progress },
    ];
    return (
      <Box
        direction={'row'}
        justify={'between'}
        margin={{ bottom: 'small', top: 'small' }}
      >
        <Meter
          a11yTitle={intl.formatMessage(messages.progressLabel)}
          values={values as any}
          width={'80%'}
        />
        <Text color={'brand'} weight={'bold'}>{`${progress}%`}</Text>
      </Box>
    );
  },
);

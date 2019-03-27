import { Box, Meter, MeterProps, Text } from 'grommet';
import React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import styled from 'styled-components';

const messages = defineMessages({
  progressLabel: {
    defaultMessage: 'Upload progress',
    description: 'Accessibility message for the upload progress bar.',
    id: 'components.DashboardVideoPaneProgress.progressLabel',
  },
});

export const StyledMeter = styled(Meter)`
  width: 80%;
`;

interface DashboardObjectProgressProps {
  progress: number;
}

export const DashboardObjectProgress = injectIntl(
  ({
    intl,
    progress = 0,
  }: DashboardObjectProgressProps & InjectedIntlProps) => {
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
        <StyledMeter
          a11yTitle={intl.formatMessage(messages.progressLabel)}
          values={values as any}
        />
        <Text color={'brand'} weight={'bold'}>{`${progress}%`}</Text>
      </Box>
    );
  },
);

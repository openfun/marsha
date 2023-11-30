import { Box, Grid, Text } from 'lib-components';
import { DateTime, DurationObjectUnits } from 'luxon';
import React, { useCallback, useEffect } from 'react';

interface DashboardClassroomStudentCounterProps {
  starting_at: string;
}

export const DashboardClassroomStudentCounter = ({
  starting_at,
}: DashboardClassroomStudentCounterProps) => {
  const [counter, setCounter] = React.useState<
    DurationObjectUnits | undefined
  >();

  const updateCounter = useCallback(() => {
    const startingAt = DateTime.fromISO(starting_at).setZone(
      DateTime.local().zoneName as string,
      { keepLocalTime: true },
    );

    setCounter(
      startingAt
        .diffNow(['days', 'hours', 'minutes', 'seconds'])
        .mapUnits((x, u) => (u === 'seconds' ? Math.floor(x) : x))
        .toObject(),
    );
  }, [starting_at]);

  useEffect(() => {
    if (!counter) {
      updateCounter();
      return;
    }

    const timeout = window.setTimeout(updateCounter, 1000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [counter, updateCounter]);

  if (counter) {
    return (
      <Box margin={{ top: 'large' }}>
        <Grid columns={{ count: 4, size: 'auto' }}>
          {Object.entries(counter).map(([name, value]) => (
            <Box key={name}>
              <Text size="xlarge" weight="bold" textAlign="center">
                {value}
              </Text>
              <Text textAlign="center">{name}</Text>
            </Box>
          ))}
        </Grid>
      </Box>
    );
  }
  return null;
};

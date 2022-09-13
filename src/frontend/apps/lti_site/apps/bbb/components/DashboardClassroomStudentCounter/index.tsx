import { Box, Grid, Text } from 'grommet';
import { DateTime, DurationObjectUnits } from 'luxon';
import React, { useCallback, useEffect, useMemo } from 'react';

import { Classroom } from 'apps/bbb/types/models';

interface DashboardClassroomStudentCounterProps {
  classroom: Classroom;
}

export const DashboardClassroomStudentCounter = ({
  classroom,
}: DashboardClassroomStudentCounterProps) => {
  const startingAt = useMemo(
    () =>
      DateTime.fromISO(classroom.starting_at || '').setZone(
        DateTime.local().zoneName,
        { keepLocalTime: true },
      ),
    [classroom.starting_at],
  );
  const computeCounter = useCallback(() => {
    return startingAt
      .diffNow(['days', 'hours', 'minutes', 'seconds'])
      .mapUnits((x, u) => (u === 'seconds' ? Math.floor(x) : x))
      .toObject();
  }, [startingAt]);
  const [counter, setCounter] = React.useState<DurationObjectUnits>(() =>
    computeCounter(),
  );

  useEffect(() => {
    let timeout: number | undefined;
    if (startingAt) {
      timeout = window.setTimeout(() => setCounter(computeCounter()), 1000);
    }
    return () => {
      window.clearTimeout(timeout);
    };
  }, [startingAt, computeCounter]);

  if (counter) {
    return (
      <Box margin={{ top: 'large' }}>
        <Grid columns={{ count: 4, size: 'auto' }}>
          {Object.entries(counter).map(([name, value]) => (
            <Box key={name}>
              <Text
                size="large"
                weight="bold"
                color="blue-active"
                textAlign="center"
              >
                {value}
              </Text>
              <Text color="blue-active" textAlign="center">
                {name}
              </Text>
            </Box>
          ))}
        </Grid>
      </Box>
    );
  }

  return null;
};

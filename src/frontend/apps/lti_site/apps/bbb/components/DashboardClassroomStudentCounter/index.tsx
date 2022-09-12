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
  const [counter, setCounter] = React.useState<
    DurationObjectUnits | undefined
  >();

  const updateCounter = useCallback(() => {
    setCounter(
      startingAt
        .diffNow(['days', 'hours', 'minutes', 'seconds'])
        .mapUnits((x, u) => (u === 'seconds' ? Math.floor(x) : x))
        .toObject(),
    );
  }, [startingAt]);

  useEffect(() => {
    if (!counter) {
      updateCounter();
    }
  }, [counter, updateCounter]);

  useEffect(() => {
    let timeout: number | undefined;
    if (classroom.starting_at && counter) {
      timeout = window.setTimeout(updateCounter, 1000);
    }
    return () => {
      window.clearTimeout(timeout);
    };
  }, [classroom, counter, updateCounter]);

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

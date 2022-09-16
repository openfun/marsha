import { useParticipantsStore } from 'data/stores/useParticipantsStore';
import { Box, Heading, Paragraph } from 'grommet';
import { Nullable } from 'lib-common';
import React, { Fragment, useMemo } from 'react';
import { DateTime } from 'luxon';

import { useIntl } from 'react-intl';

interface LiveInfoBarProps {
  title: string;
  startDate: Nullable<string>;
}

export const LiveInfoBar = ({ title, startDate }: LiveInfoBarProps) => {
  const participants = useParticipantsStore((state) => state.participants);
  const intl = useIntl();
  const localStartDate = useMemo(() => {
    if (!startDate) return null;

    const dt = DateTime.fromISO(startDate);
    return dt.isValid ? dt.setLocale(intl.locale).toFormat('D  ·  tt') : null;
  }, [startDate, intl]);

  return (
    <Fragment>
      <Heading
        a11yTitle={title}
        color="blue-active"
        level="1"
        margin={{ bottom: 'small' }}
        size="1.3rem"
        title={title}
        truncate
        style={{ maxWidth: '100%' }}
      >
        {title}
      </Heading>

      <Box direction="row">
        {participants.length > 0 && (
          <Paragraph
            color="blue-active"
            margin={{ right: 'large', bottom: 'none' }}
            size="small"
          >
            {`${participants.length} viewers connected.`}
          </Paragraph>
        )}
        {localStartDate && (
          <Paragraph
            color="blue-active"
            margin={{ right: 'large', bottom: 'none' }}
            size="small"
          >
            {localStartDate}
          </Paragraph>
        )}
      </Box>
    </Fragment>
  );
};

import React, { useContext } from 'react';
import { Box, Paragraph, Text, Heading, ResponsiveContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';

import { liveState } from 'types/tracks';
import { theme } from 'utils/theme/theme';

const RedDotSpan = styled(Text)`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${normalizeColor('red-active', theme)};
`;

interface LiveTitleInformationProps {
  title: string;
  state: liveState | null;
}

export const LiveTitleInformation = ({
  title,
  state,
}: LiveTitleInformationProps) => {
  const size = useContext(ResponsiveContext);

  return (
    <Box
      direction="column"
      margin={size === 'small' ? { bottom: 'large' } : { bottom: 'none' }}
    >
      <Heading
        level="2"
        margin={{ bottom: 'small' }}
        size="small"
        color="blue-active"
      >
        {title}
      </Heading>

      <Box direction="row">
        <Paragraph
          color="blue-active"
          margin={{ right: 'large', bottom: 'none' }}
          size="small"
        >
          {/* video.starting_at */}
          xx/xx/xxxx &#183; 14:00:00
        </Paragraph>
        <Box direction="row" align="center">
          {/* red circle*/}
          {state === liveState.RUNNING && (
            <RedDotSpan margin={{ right: 'xsmall' }} id={'red-dot-id'} />
          )}
          <Paragraph color="blue-active" margin="none" size="small">
            xx:xx:xx
          </Paragraph>
        </Box>
      </Box>
    </Box>
  );
};

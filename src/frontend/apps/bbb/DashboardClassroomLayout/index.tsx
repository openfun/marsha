import { Box, Grid, ResponsiveContext, Text } from 'grommet';
import React, { useContext } from 'react';

import { appData } from 'data/appData';
import { Nullable } from 'utils/types';

interface DashboardMeetingMessageProps {
  message: string;
}

export const DashboardMeetingMessage = ({
  message,
}: DashboardMeetingMessageProps) => (
  <Box
    margin={{ top: 'xlarge', horizontal: 'small' }}
    pad={{ vertical: 'small', horizontal: 'small' }}
    background="blue-message"
    round="xsmall"
  >
    <Text color="blue-active" textAlign="center" weight="bold">
      {message}
    </Text>
  </Box>
);

interface DashboardMeetingLayoutProps {
  left: JSX.Element;
  right?: Nullable<JSX.Element>;
}

export const DashboardMeetingLayout = ({
  left,
  right,
}: DashboardMeetingLayoutProps) => {
  const size = useContext(ResponsiveContext);
  let columns = ['1/2', '1/2'];
  if (size === 'medium') {
    columns = ['2/3', '1/3'];
  } else if (size === 'small') {
    columns = ['full'];
  }
  return (
    <Box
      background={{
        image: `url(${appData.static.img.bbbBackground})`,
        size: 'cover',
        position: 'right top',
      }}
      fill
      pad="small"
    >
      <Grid columns={columns} gap="small" fill>
        <Box
          background={{ color: 'white' }}
          round="xsmall"
          pad={{
            horizontal: 'medium',
            vertical: 'small',
          }}
          height={{ min: 'medium' }}
        >
          {left}
        </Box>
        <Box>
          <Box
            height="30px"
            width="30px"
            background={{
              image: `url(${appData.static.img.bbbLogo})`,
              size: 'cover',
              position: 'left center',
            }}
          >
            <Text
              margin={{ top: '5px', left: '35px' }}
              size="small"
              color="white"
            >
              BigBlueButton
            </Text>
          </Box>
          <Box
            align={size !== 'small' ? 'end' : 'center'}
            direction="row"
            flex={true}
            gap="medium"
            justify="end"
            pad="medium"
          >
            {right}
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

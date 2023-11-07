import { Grid } from 'grommet';
import { Breakpoints, Nullable, colorsTokens } from 'lib-common';
import { Box, Text, useAppConfig, useResponsive } from 'lib-components';
import React from 'react';

interface DashboardClassroomMessageProps {
  message: string;
}

export const DashboardClassroomMessage = ({
  message,
}: DashboardClassroomMessageProps) => (
  <Box
    margin={{ top: 'xlarge', horizontal: 'small' }}
    pad={{ vertical: 'small', horizontal: 'small' }}
    background={colorsTokens['info-100']}
    round="xsmall"
  >
    <Text textAlign="center" weight="bold">
      {message}
    </Text>
  </Box>
);

interface DashboardClassroomLayoutProps {
  left: JSX.Element;
  right?: Nullable<JSX.Element>;
}

export const DashboardClassroomLayout = ({
  left,
  right,
}: DashboardClassroomLayoutProps) => {
  const appData = useAppConfig();
  const { isSmallerBreakpoint, breakpoint, isDesktop } = useResponsive();
  let columns = ['1/2', '1/2'];
  if (!isDesktop) {
    columns = ['full'];
  } else if (isSmallerBreakpoint(breakpoint, Breakpoints.large)) {
    columns = ['2/3', '1/3'];
  }
  return (
    <Box
      style={{
        backgroundImage: `url(${appData.static.img.bbbBackground || ''})`,
        backgroundSize: 'cover',
        backgroundPosition: 'right top',
      }}
      fill
      pad="small"
      className="DashboardClassroomLayout"
    >
      <Grid columns={columns} gap="small" fill>
        <Box
          background="white"
          round="xsmall"
          pad={{
            horizontal: 'medium',
            vertical: 'small',
          }}
          height={{ min: 'medium' }}
        >
          {left}
        </Box>
        <Box justify="space-between">
          <Box direction="row" align="center" gap="xsmall">
            <img
              height="30px"
              width="30px"
              src={appData.static.img.bbbLogo || ''}
              alt="BigBlueButton Logo"
            />
            <Text color="white">BigBlueButton</Text>
          </Box>
          <Box
            align={isDesktop ? 'end' : 'center'}
            direction="row"
            gap="medium"
            justify="end"
            pad="medium"
            className="classroom-edit-submit"
          >
            {right}
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

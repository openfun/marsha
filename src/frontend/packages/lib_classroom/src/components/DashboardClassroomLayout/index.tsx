import { Nullable, colorsTokens } from 'lib-common';
import { Box, Text, useAppConfig, useResponsive } from 'lib-components';
import React, { JSX } from 'react';

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
  const { isDesktop } = useResponsive();

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
      <Box direction="row" gap="small" wrap="wrap">
        <Box
          background="white"
          round="xsmall"
          pad={{
            horizontal: 'medium',
            vertical: 'small',
          }}
          height={{ min: 'medium' }}
          width={{ min: 'none' }}
          flex="grow"
          basis="60%"
        >
          {left}
        </Box>
        <Box justify="space-between" flex="grow">
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
      </Box>
    </Box>
  );
};

import { Stack } from 'grommet';
import React from 'react';

import { Image } from '@lib-components/common';
import { useAppConfig } from '@lib-components/data/stores/useAppConfig';
import { useResponsive } from '@lib-components/hooks/useResponsive';

import { Box } from '../Box';

interface WizardLayoutProps {
  children: React.ReactNode | React.ReactNode[];
}

export const WizardLayout = ({ children }: WizardLayoutProps) => {
  const appData = useAppConfig();
  const { isMobile: isSmall } = useResponsive();

  return (
    <Box direction="row">
      {!isSmall && (
        <Box basis="50%" margin={{ right: 'auto' }}>
          <Box fill background="rgb(5, 95, 210)">
            <Stack guidingChild="first">
              <Image
                src={appData.static.img.videoWizardBackground}
                style={{ maxWidth: '100%' }}
              />
              <Box
                fill
                background="linear-gradient(0deg, rgba(3,92,205,0.9) 0%, rgba(255,11,57,0.3) 100%)"
              />
              <Box fill>
                <Image
                  src={appData.static.img.marshaWhiteLogo}
                  margin="auto"
                  style={{ maxWidth: '100%' }}
                />
              </Box>
            </Stack>
            <Box background="rgba(3,92,205,0.9)" />
          </Box>
        </Box>
      )}
      {children}
    </Box>
  );
};

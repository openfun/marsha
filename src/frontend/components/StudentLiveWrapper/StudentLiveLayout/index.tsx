import React from 'react';
import { Box, ResponsiveContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';

import { theme } from 'utils/theme/theme';

const LiveVideoInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
`;

interface LiveStudentLayoutProps {
  actionsElement: React.ReactElement;
  displayActionsElement: boolean;
  isPanelOpen?: boolean;
  liveTitleElement: React.ReactElement;
  mainElement: React.ReactElement;
  sideElement?: React.ReactElement;
}

export const StudentLiveLayout = ({
  actionsElement,
  displayActionsElement,
  isPanelOpen,
  liveTitleElement,
  mainElement,
  sideElement,
}: LiveStudentLayoutProps) => {
  const size = React.useContext(ResponsiveContext);

  if (size === 'small') {
    return (
      <Box style={{ minHeight: '100vh' }}>
        <Box flex="grow">
          <Box flex="grow" hidden={isPanelOpen}>
            <Box flex="grow">
              <Box margin={{ top: 'auto', bottom: 'auto' }}>{mainElement}</Box>
            </Box>

            <Box margin={{ top: '12px' }}>
              <LiveVideoInformationBarWrapper />
              <Box background="white" pad={{ left: 'small' }}>
                {liveTitleElement}
              </Box>
            </Box>
          </Box>

          {sideElement && (
            <Box flex="grow" hidden={!isPanelOpen}>
              {sideElement}
            </Box>
          )}
        </Box>

        {displayActionsElement && (
          <Box height={'67px'} margin={{ top: 'small' }}>
            {actionsElement}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box direction="row">
        {/* main view rendering player or conf to stream */}
        <Box basis="full">{mainElement}</Box>

        {sideElement && (
          // for now panel is kept in the DOM but hiden to mount chat and therfore connect to XMPP
          <Box basis="1/4" hidden={!isPanelOpen}>
            {sideElement}
          </Box>
        )}
      </Box>

      <LiveVideoInformationBarWrapper
        align="center"
        direction="row-responsive"
        height="80px"
        justify="between"
        margin="small"
        pad={{ bottom: 'small', left: 'medium', right: 'medium', top: 'small' }}
        round="6px"
      >
        {liveTitleElement}
        {displayActionsElement && actionsElement}
      </LiveVideoInformationBarWrapper>
    </Box>
  );
};

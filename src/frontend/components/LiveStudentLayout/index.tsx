import React from 'react';
import { Box } from 'grommet';

interface LiveStudentLayoutProps {
  mainElement: React.ReactElement;
  sideElement?: React.ReactElement;
  isPanelOpen?: boolean;
  bottomElement: React.ReactElement;
}

export const LiveStudentLayout = ({
  mainElement,
  sideElement,
  isPanelOpen,
  bottomElement,
}: LiveStudentLayoutProps) => {
  return (
    <Box>
      <Box direction="row">
        {/* main view rendering player or conf to stream */}
        <Box basis="full">{mainElement}</Box>

        {sideElement && isPanelOpen && <Box basis="1/4">{sideElement}</Box>}
      </Box>

      {bottomElement}
    </Box>
  );
};

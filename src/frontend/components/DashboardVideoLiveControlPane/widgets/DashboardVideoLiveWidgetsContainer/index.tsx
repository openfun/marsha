import { Box, ResponsiveContext } from 'grommet';
import React from 'react';

interface DashboardVideoLiveWidgetsContainerProps {
  children: React.ReactNode[];
}

export const DashboardVideoLiveWidgetsContainer = ({
  children,
}: DashboardVideoLiveWidgetsContainerProps) => {
  const size = React.useContext(ResponsiveContext);
  let nbrOfColumns: number;
  switch (size) {
    case 'small':
      nbrOfColumns = 1;
      break;
    case 'medium':
      nbrOfColumns = 2;
      break;
    default:
      nbrOfColumns = 3;
  }

  if (children.length === 0) {
    return null;
  }

  return (
    <Box direction="row" gap="10px" pad={{ horizontal: '10px' }}>
      {[...Array(nbrOfColumns)].map((_, indexColumn) => (
        <Box
          direction="column"
          gap="10px"
          key={indexColumn}
          width={`${100 / nbrOfColumns}%`}
        >
          {children
            .filter((__, indexComponent) =>
              indexComponent < nbrOfColumns
                ? indexComponent === indexColumn
                : indexComponent % nbrOfColumns === indexColumn,
            )
            .map((component, index) => (
              <Box key={index}>{component}</Box>
            ))}
        </Box>
      ))}
    </Box>
  );
};

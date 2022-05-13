import { Box, ResponsiveContext } from 'grommet';
import React from 'react';

import { DashboardVideoLiveInfoModal } from 'components/DashboardVideoLiveControlPane/customs/DashboardVideoLiveInfoModal';
import { useInfoWidgetModal } from 'data/stores/useInfoWidgetModal/index';

interface DashboardVideoLiveWidgetsContainerProps {
  children: React.ReactNode[];
}

export const DashboardVideoLiveWidgetsContainer = ({
  children,
}: DashboardVideoLiveWidgetsContainerProps) => {
  const [infoWidgetModal, setInfoWidgetModal] = useInfoWidgetModal();

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
    <React.Fragment>
      {infoWidgetModal && (
        <DashboardVideoLiveInfoModal
          text={infoWidgetModal.text}
          title={infoWidgetModal.title}
          onModalClose={() => setInfoWidgetModal(null)}
        />
      )}

      <Box direction="row" background="bg-marsha" gap="small" pad="small">
        {[...Array(nbrOfColumns)].map((_, indexColumn) => (
          <Box
            direction="column"
            gap="small"
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
    </React.Fragment>
  );
};

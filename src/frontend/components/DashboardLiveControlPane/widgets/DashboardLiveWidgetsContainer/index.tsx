import { Box, ResponsiveContext } from 'grommet';
import React from 'react';

import { DashboardLiveInfoModal } from 'components/DashboardLiveControlPane/customs/DashboardLiveInfoModal';
import { useInfoWidgetModal } from 'data/stores/useInfoWidgetModal/index';

interface DashboardLiveWidgetsContainerProps {
  children: React.ReactNode | React.ReactNode[];
}

export const DashboardLiveWidgetsContainer = ({
  children,
}: DashboardLiveWidgetsContainerProps) => {
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

  if (!children || (Array.isArray(children) && children.length === 0)) {
    return null;
  }

  return (
    <React.Fragment>
      {infoWidgetModal && (
        <DashboardLiveInfoModal
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
            {Array.isArray(children)
              ? children
                  .filter((__, indexComponent) =>
                    indexComponent < nbrOfColumns
                      ? indexComponent === indexColumn
                      : indexComponent % nbrOfColumns === indexColumn,
                  )
                  .map((component, index) => <Box key={index}>{component}</Box>)
              : indexColumn === 0
              ? children
              : null}
          </Box>
        ))}
      </Box>
    </React.Fragment>
  );
};

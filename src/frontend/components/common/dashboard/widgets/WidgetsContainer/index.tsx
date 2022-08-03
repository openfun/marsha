import { Box, ResponsiveContext } from 'grommet';
import React from 'react';

import { InfoModal } from 'components/common/dashboard/widgets/components/InfoModal';
import { useInfoWidgetModal } from 'data/stores/useInfoWidgetModal/index';

interface WidgetsContainerProps {
  children: React.ReactNode | React.ReactNode[];
}

export const WidgetsContainer = ({ children }: WidgetsContainerProps) => {
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
        <InfoModal
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

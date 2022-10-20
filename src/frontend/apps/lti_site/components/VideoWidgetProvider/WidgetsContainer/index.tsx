import { Box, ResponsiveContext } from 'grommet';
import React from 'react';

import { InfoModal } from 'components/graphicals/InfoModal';
import { useInfoWidgetModal } from 'data/stores/useInfoWidgetModal/index';
import { WidgetProps, WidgetSize } from '..';

interface WidgetsContainerProps {
  children: WidgetProps | WidgetProps[];
}

export const WidgetsContainer = ({ children }: WidgetsContainerProps) => {
  const [infoWidgetModal, setInfoWidgetModal] = useInfoWidgetModal();

  const layoutSize = React.useContext(ResponsiveContext);
  let nbrOfColumns: number;
  switch (layoutSize) {
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

      {Array.isArray(children)
        ? children
            .filter((widget) => widget.size === WidgetSize.LARGE)
            .map((widget, index) => (
              <Box
                direction="column"
                background="bg-marsha"
                gap="small"
                pad="small"
                key={index}
              >
                {widget.component}
              </Box>
            ))
        : children.size === WidgetSize.LARGE
        ? children.component
        : null}

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
                  .filter((widget) => widget.size === WidgetSize.DEFAULT)
                  .filter((__, indexComponent) =>
                    indexComponent < nbrOfColumns
                      ? indexComponent === indexColumn
                      : indexComponent % nbrOfColumns === indexColumn,
                  )
                  .map((widget, index) => (
                    <Box key={index}>{widget.component}</Box>
                  ))
              : indexColumn === 0 && children.size === WidgetSize.DEFAULT
              ? children.component
              : null}
          </Box>
        ))}
      </Box>
    </React.Fragment>
  );
};

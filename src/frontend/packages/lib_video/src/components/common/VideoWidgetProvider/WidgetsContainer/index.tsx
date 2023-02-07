import { Box, ResponsiveContext } from 'grommet';
import React from 'react';

import { useInfoWidgetModal } from 'hooks/useInfoWidgetModal';

import { InfoModal } from './InfoModal';

export enum WidgetSize {
  DEFAULT = 'default',
  LARGE = 'large',
}

export interface WidgetProps {
  component: React.ReactNode;
  size: WidgetSize;
}

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
  const mapper: unknown[] = Array(nbrOfColumns).fill(0);

  if (!children || (Array.isArray(children) && children.length === 0)) {
    return null;
  }

  return (
    <React.Fragment>
      {infoWidgetModal && (
        <InfoModal
          text={infoWidgetModal.text}
          title={infoWidgetModal.title}
          refWidget={infoWidgetModal.refWidget}
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
                key={index}
              >
                {widget.component}
              </Box>
            ))
        : children.size === WidgetSize.LARGE
        ? children.component
        : null}

      <Box direction="row" background="bg-marsha">
        {mapper.map((_, indexColumn) => (
          <Box
            direction="column"
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

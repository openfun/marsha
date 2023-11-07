import { colorsTokens } from '@lib-common/cunningham';
import React, { useEffect, useRef, useState } from 'react';

import { useInfoWidgetModal } from '@lib-components/hooks/stores/useInfoWidgetModal';

import { Box } from '..';

import { InfoModal } from './InfoModal';

const WIDGETS_COLUMN = {
  DEFAULT: 2,
  MIN: 1,
  MAX: 3,
  MIN_WIDTH: 380, // px
  MAX_WIDTH: 600, // px
};

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
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [nbrOfColumns, setNbrOfColumns] = useState(WIDGETS_COLUMN.DEFAULT);

  useEffect(() => {
    const handleResize = () => {
      if (!mainContainerRef.current?.offsetWidth) {
        return;
      }

      let columns = Math.floor(
        mainContainerRef.current?.offsetWidth / WIDGETS_COLUMN.MIN_WIDTH,
      );
      columns = columns > WIDGETS_COLUMN.MAX ? WIDGETS_COLUMN.MAX : columns;
      setNbrOfColumns(columns || WIDGETS_COLUMN.MIN);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mainContainerRef.current as Element);
    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  if (!children || (Array.isArray(children) && children.length === 0)) {
    return null;
  }

  const mapper: unknown[] = Array(nbrOfColumns).fill(0);

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
                background={colorsTokens['primary-100']}
                gap="small"
                key={index}
              >
                {widget.component}
              </Box>
            ))
        : children.size === WidgetSize.LARGE
        ? children.component
        : null}

      <Box
        ref={mainContainerRef}
        direction="row"
        background={colorsTokens['primary-100']}
        justify="center"
      >
        {mapper.map((_, indexColumn) => (
          <Box
            key={indexColumn}
            width={{
              max: `${WIDGETS_COLUMN.MAX_WIDTH}px`,
              width: `${100 / nbrOfColumns}%`,
            }}
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

import {
  Select as SelectGrommet,
  SelectExtendedProps as SelectPropsGrommet,
} from 'grommet';
import React, { useEffect, useRef, useState } from 'react';

/**
 * @param maxDropHeight - in pixel, the place needed to the drop to be displayed at the bottom of the select
 */
interface SelectProps extends SelectPropsGrommet {
  maxDropHeight?: number; // px
}

export const Select = ({
  children,
  maxDropHeight = 400,
  ...props
}: SelectProps) => {
  const refSelect = useRef<HTMLInputElement>(null);
  const [selectDropWidth, setSelectDropWidth] = useState(0);
  const [selectDropPosition, setSelectDropPosition] = useState<{
    bottom?: 'bottom' | 'top';
    top?: 'bottom' | 'top';
  }>({ bottom: 'top' });

  useEffect(() => {
    function handleResize() {
      setSelectDropWidth(refSelect.current?.clientWidth || 0);
      setSelectDropPosition(
        document.body.clientHeight - (refSelect.current?.offsetTop || 0) <
          maxDropHeight
          ? { bottom: 'top' }
          : { top: 'bottom' },
      );
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [maxDropHeight]);

  return (
    <SelectGrommet
      ref={refSelect}
      dropAlign={{ ...selectDropPosition, left: 'left' }}
      dropProps={{
        width: `${selectDropWidth}px`,
      }}
      dropHeight={`${maxDropHeight}px`}
      {...props}
    >
      {children}
    </SelectGrommet>
  );
};

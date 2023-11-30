import { forwardRef } from 'react';

import { Box, BoxProps } from '..';
import { SizeValue, Sizes, sizesValue } from '../../Typo';

type ColumnsCount = { count: number; size: Sizes };

const isColumnsCount = (
  columns: Sizes | ColumnsCount,
): columns is ColumnsCount => (columns as ColumnsCount).count !== undefined;

export interface GridPropsOnly {
  columns?: Sizes | ColumnsCount;
}

type GridProps = Omit<
  BoxProps<'div'>,
  'basis' | 'flex' | 'flow' | 'wrap' | 'direction'
> &
  GridPropsOnly;

/**
 * @param GridProps -
 * @inheritdoc {@link Typo}
 * @returns Grid component
 */
const Grid = forwardRef<HTMLElement, GridProps>(
  ({ className, columns, style, ...props }, ref) => {
    let moreStyles = {};
    if (columns) {
      let count: string | number = '';
      let size: SizeValue = '';
      if (isColumnsCount(columns)) {
        count = columns.count;
        size = sizesValue(columns.size);
      } else {
        count = 'auto-fill';
        size = sizesValue(columns);
      }

      if (typeof size === 'number') {
        size = `min(${size}px, 100%)`;
      } else if (typeof size === 'string' && size.includes('px')) {
        size = `min(${size}, 100%)`;
      }

      moreStyles = {
        ...moreStyles,
        gridTemplateColumns: size && `repeat(${count}, minmax(${size}, 1fr))`,
      };
    }

    return (
      <Box
        ref={ref}
        className={`typo-grid ${className || ''}`}
        style={{
          ...moreStyles,
          ...style,
        }}
        {...props}
      />
    );
  },
);

Grid.displayName = 'Grid';
export { Grid };

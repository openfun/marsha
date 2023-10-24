import { forwardRef } from 'react';

import { Typo, TypoProps } from '../Typo';

export interface HeadingPropsOnly {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

type HeadingProps = Omit<TypoProps<'h1', HeadingPropsOnly>, 'type'>;

/**
 * @param HeadingProps -
 *  - level - 1 | 2 | 3 | 4 | 5 | 6
 * @inheritdoc {@link Typo}
 * @returns Heading component
 */
const Heading = forwardRef<HTMLElement, HeadingProps>(
  ({ className, level = 1, ...props }, ref) => {
    if (level < 1 || level > 6) {
      throw new Error('Heading level must be between 1 and 6');
    }

    return (
      <Typo
        ref={ref}
        type={`h${level}`}
        className={`fs-h fs-h${level} ${className || ''}`}
        {...props}
      />
    );
  },
);

Heading.displayName = 'Heading';
export { Heading };

import { colorsTokens } from 'lib-common';
import { ReactElement, ReactHTML, Ref, forwardRef } from 'react';

import {
  Spacings,
  Typo,
  TypoProps,
  spacingValue,
} from '@lib-components/common/Typo';

export { Grid } from './Grid';

export interface BoxPropsOnly {
  round?: Spacings;
  elevation?: boolean;
}

export type BoxTypes = Pick<
  ReactHTML,
  'div' | 'header' | 'footer' | 'article' | 'ul' | 'li' | 'nav' | 'section'
>;

/**
 * @description Typo props
 * @param T - keyof BoxTypes
 * @example
 * type Props = BoxProps<'div'>;
 * // type Props = ReactHTMLInfer<div> & BoxPropsOnly & TypoPropsOnly & HTMLAttributes<HTMLDivElement>
 */
export type BoxProps<T extends keyof BoxTypes> = TypoProps<
  T,
  BoxPropsOnly,
  BoxTypes
>;

/**
 * @param BoxPropsOnly -
 *  - type - {@link TextTypes}
 * @See {@link Typo }
 * @returns Box component
 */
const BoxRef = forwardRef(
  <T extends keyof BoxTypes = 'div'>(
    {
      align = 'normal',
      className,
      direction = 'column',
      elevation,
      justify = 'normal',
      round,
      type = 'div',
      ...props
    }: BoxProps<T>,
    ref: Ref<HTMLElement>,
  ) => {
    return (
      <Typo<keyof BoxTypes>
        align={align}
        direction={direction}
        justify={justify}
        ref={ref}
        type={type}
        className={`typo-box ${className || ''}`}
        {...props}
        style={{
          borderRadius: spacingValue(round),
          boxShadow: elevation
            ? `0 2px 6px ${colorsTokens['primary-500']}44`
            : undefined,
          ...props.style,
        }}
      />
    );
  },
);

BoxRef.displayName = 'Box';

export const Box = BoxRef as <T extends keyof BoxTypes = 'div'>(
  p: BoxProps<T>,
) => ReactElement;

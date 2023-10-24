import { ReactElement, ReactHTML, Ref, forwardRef } from 'react';

import { Typo, TypoProps } from '@lib-components/common/Typo';

export const TextWeights = {
  black: 'fw-black',
  extrabold: 'fw-extrabold',
  bold: 'fw-bold',
  medium: 'fw-medium',
  regular: 'fw-regular',
  light: 'fw-light',
  thin: 'fw-thin',
} as const;

export const TextSizes = {
  large: 'fs-l',
  xlarge: 'fs-xl',
  'medium-large': 'fs-ml',
  medium: 'fs-m',
  small: 'fs-s',
  tiny: 'fs-t',
} as const;

export interface TextPropsOnly {
  size?: keyof typeof TextSizes;
  weight?: keyof typeof TextWeights;
}

type TextTypes = Pick<ReactHTML, 'p' | 'span' | 'div'>;

/**
 * @description Typo props
 * @param T - keyof TextTypes
 * @example
 * type Props = TextProps<'div'>;
 * // type Props = ReactHTMLInfer<div> & TextPropsOnly & TypoPropsOnly & HTMLAttributes<HTMLDivElement>
 */
export type TextProps<T extends keyof TextTypes> = TypoProps<
  T,
  TextPropsOnly,
  TextTypes
>;

/**
 * @param TextPropsOnly -
 *  - size - {@link TextSizes}
 *  - type - {@link TextTypes}
 *  - weight - {@link TextWeights}
 * @See {@link Typo }
 * @returns Text component
 */
const TextRef = forwardRef(
  <T extends keyof TextTypes = 'span'>(
    {
      className,
      size = 'medium-large',
      type = 'span',
      weight = 'regular',
      ...props
    }: TextProps<T>,
    ref: Ref<HTMLElement>,
  ) => {
    return (
      <Typo<keyof TextTypes>
        ref={ref}
        type={type}
        className={`typo-text ${TextWeights[weight]} ${TextSizes[size]} ${
          className || ''
        }`}
        {...props}
      />
    );
  },
);

TextRef.displayName = 'Text';

export const Text = TextRef as <T extends keyof TextTypes = 'span'>(
  p: TextProps<T>,
) => ReactElement;

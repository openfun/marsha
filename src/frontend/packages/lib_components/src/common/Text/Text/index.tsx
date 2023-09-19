import { ReactHTML } from 'react';

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
export const Text = <T extends keyof TextTypes = 'span'>({
  className,
  size = 'medium-large',
  type = 'span',
  weight = 'regular',
  ...props
}: TextProps<T>) => {
  return (
    <Typo<keyof TextTypes>
      type={type}
      className={`typo-text ${TextWeights[weight]} ${TextSizes[size]} ${
        className || ''
      }`}
      {...props}
    />
  );
};

import {
  CSSProperties,
  DetailedHTMLFactory,
  ReactElement,
  ReactHTML,
  Ref,
  createElement,
  forwardRef,
} from 'react';

import {
  Flex,
  Height,
  MarginPadding,
  Width,
  stylesFlex,
  stylesHeight,
  stylesMargin,
  stylesPad,
  stylesTruncate,
  stylesWidth,
} from './styleBuilder';

export * from './styleBuilder';

/**
 * @description Obtain HTML props from {@link ReactHTML}
 * @param T -ReactHTML[keyof ReactHTML]
 * @returns ObtainHTMLProps
 * @example
 * type Props = ObtainHTMLProps<ReactHTML['div']>; // type Props = HTMLAttributes<HTMLDivElement>
 */
export type ObtainHTMLProps<T extends ReactHTML[keyof ReactHTML]> =
  T extends DetailedHTMLFactory<infer Props, HTMLElement> ? Props : never;

/**
 * @description Typo props only
 * @returns TypoPropsOnly
 */
export interface TypoPropsOnly {
  align?: CSSProperties['alignItems'];
  background?: CSSProperties['background'];
  basis?: CSSProperties['flexBasis'];
  color?: CSSProperties['color'];
  display?: CSSProperties['display'];
  fill?: boolean | 'horizontal' | 'vertical' | 'full';
  flex?: Flex;
  flow?: CSSProperties['flexFlow'];
  fontSize?: CSSProperties['fontSize'];
  height?: Height;
  justify?: CSSProperties['justifyContent'];
  margin?: MarginPadding;
  overflow?: CSSProperties['overflow'];
  pad?: MarginPadding;
  position?: CSSProperties['position'];
  ref?: Ref<HTMLElement>;
  textAlign?: CSSProperties['textAlign'];
  truncate?: boolean | number;
  width?: Width;
}

/**
 * @description From this variable we can infer the type of the component
 * @param T - keyof ReactHTML - is used to infer
 * @param G - keyof ReactHTML - is used to get the list of keys when a default component is setted
 * @example
 * type Props = ReactHTMLInfer<'div', ReactHTML>; // type Props = { type?: "div" | keyof ReactHTML; }
 */
export interface ReactHTMLInfer<
  T extends keyof ReactHTML,
  G extends Partial<ReactHTML>,
> {
  type?: T | keyof G;
}

/**
 * @description Typo props
 * @param T - keyof {@link ReactHTML}
 * @param U - Any interface
 * @param G - Partial {@link ReactHTML}
 * @returns TypoProps
 * @example
 * type Props = TypoProps<'div'>; // type Props = ReactHTMLInfer<div> & TypoPropsOnly & HTMLAttributes<HTMLDivElement>
 */
export type TypoProps<
  T extends keyof ReactHTML,
  U = Record<string, unknown>,
  G extends Partial<ReactHTML> = ReactHTML,
> = U & TypoPropsOnly & ReactHTMLInfer<T, G> & ObtainHTMLProps<ReactHTML[T]>;

/**
 *  @param TypoPropsOnly -
 *  - className - string - more here {@link https://openfun.github.io/cunningham/?path=/docs/getting-started-spacings--docs}
 *  - color {@link CSSProperties}
 *  - fontSize {@link CSSProperties}
 *  - textAlign {@link CSSProperties}
 *  - truncate - boolean
 *  - type - keyof {@link ReactHTML}
 *  - props - HTMLAttributes<T>
 * @returns Typo component
 */
const TypoRef = forwardRef(
  <T extends keyof ReactHTML = 'div'>(
    {
      align,
      background,
      basis,
      children,
      className,
      color,
      display,
      fill,
      flex,
      flow,
      fontSize,
      height,
      justify,
      margin,
      overflow,
      pad,
      position,
      textAlign,
      truncate,
      type = 'div',
      width,
      ...props
    }: TypoProps<T>,
    ref: Ref<TypoProps<T>>,
  ) => {
    let moreStyles = {};
    if (truncate) {
      moreStyles = {
        ...moreStyles,
        ...stylesTruncate(truncate),
      };
    }

    if (pad) {
      moreStyles = {
        ...moreStyles,
        ...stylesPad(pad),
      };
    }

    if (margin) {
      moreStyles = {
        ...moreStyles,
        ...stylesMargin(margin),
      };
    }

    if (width) {
      moreStyles = {
        ...moreStyles,
        ...stylesWidth(width),
      };
    }

    if (height) {
      moreStyles = {
        ...moreStyles,
        ...stylesHeight(height),
      };
    }

    let colorClassname = '';
    // if color is a classname
    if (color && color.startsWith('clr-')) {
      colorClassname = ` ${color}`;
    }

    let bgClassname = '';
    // if background is a classname
    if (
      background &&
      typeof background === 'string' &&
      background.startsWith('bg-')
    ) {
      bgClassname = ` ${background}`;
    }

    if (flex) {
      moreStyles = {
        ...moreStyles,
        ...stylesFlex(flex),
      };
    }

    return createElement(
      type,
      {
        className: `typo ${className || ''}${colorClassname}${bgClassname}`,
        ref,
        ...props,
        style: {
          alignItems: align,
          background: bgClassname ? undefined : background,
          color: colorClassname ? undefined : color,
          display,
          flexBasis: basis,
          flexFlow: flow,
          fontSize,
          height: fill && fill !== 'horizontal' ? '100%' : undefined,
          justifyContent: justify,
          overflow,
          position,
          textAlign,
          width: fill && fill !== 'vertical' ? '100%' : undefined,
          ...moreStyles,
          ...props.style,
        },
      },
      children,
    );
  },
);

TypoRef.displayName = 'Typo';

export const Typo = TypoRef as <T extends keyof ReactHTML = 'div'>(
  p: TypoProps<T>,
) => ReactElement;

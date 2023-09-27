import {
  CSSProperties,
  DetailedHTMLFactory,
  ReactHTML,
  createElement,
} from 'react';

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
  textAlign?: CSSProperties['textAlign'];
  color?: CSSProperties['color'];
  fontSize?: CSSProperties['fontSize'];
  truncate?: boolean | number;
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
export const Typo = <T extends keyof ReactHTML = 'div'>({
  children,
  className,
  color,
  fontSize,
  textAlign,
  truncate,
  type = 'div',
  ...props
}: TypoProps<T>) => {
  let moreStyles = {};
  if (truncate) {
    moreStyles = {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    };

    // truncate with number of lines
    if (typeof truncate === 'number') {
      moreStyles = {
        overflow: 'hidden',
        WebkitLineClamp: truncate,
        WebkitBoxOrient: 'vertical',
        display: '-webkit-box',
      };
    }
  }

  let colorClassname = '';
  // if color is a classname
  if (color && color.startsWith('clr-')) {
    colorClassname = ` ${color}`;
  }

  return createElement(
    type,
    {
      className: `typo ${className || ''}${colorClassname}`,
      ...props,
      style: {
        textAlign,
        color: colorClassname ? undefined : color,
        fontSize,
        ...moreStyles,
        ...props.style,
      },
    },
    children,
  );
};

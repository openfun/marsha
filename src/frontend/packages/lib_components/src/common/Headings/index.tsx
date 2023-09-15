import { createElement } from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  textAlign?: React.CSSProperties['textAlign'];
  color?: React.CSSProperties['color'];
  fontSize?: React.CSSProperties['fontSize'];
  truncate?: boolean;
}

export const Heading = ({
  children,
  className,
  color,
  fontSize,
  level = 1,
  textAlign,
  truncate,
  ...props
}: HeadingProps) => {
  let moreStyles = {};
  if (truncate) {
    moreStyles = {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    };
  }

  return createElement(
    `h${level}`,
    {
      className: `fs-h fs-h${level} ${className || ''}`,
      ...props,
      style: {
        textAlign,
        color,
        fontSize,
        ...moreStyles,
        ...props.style,
      },
    },
    children,
  );
};

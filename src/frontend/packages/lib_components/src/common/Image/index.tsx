import { CSSProperties, forwardRef } from 'react';

import { Typo, TypoProps } from '../Typo';

export interface ImagePropsOnly {
  fit?: CSSProperties['objectFit'];
}

type ImageProps = Omit<TypoProps<'img', ImagePropsOnly>, 'type'>;

/**
 * @param ImageProps -
 * @inheritdoc {@link Typo}
 * @returns Image component
 */
const Image = forwardRef<HTMLElement, ImageProps>(
  ({ className, fit, style, ...props }, ref) => {
    return (
      <Typo
        ref={ref}
        type="img"
        className={`typo-img ${className || ''}`}
        style={{
          objectFit: fit,
          ...style,
        }}
        {...props}
      />
    );
  },
);

Image.displayName = 'Image';
export { Image };

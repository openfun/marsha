import { Image, ImageProps } from 'grommet';
import React from 'react';
import { MessageDescriptor, useIntl } from 'react-intl';

import { Omit } from '../../utils/types';

/**
 * Component. Displays a grommet `<Image />` component that accepts an `intl` `MessageDescriptor` as
 * the value of its `alt` property to enable internationalization.
 * @param alt A MessageDescriptor with the accessibility text for the image.
 */
export const ImageIntlAlt = ({
  alt,
  ...restProps
}: ImageProps &
  Omit<JSX.IntrinsicElements['img'], 'alt'> & {
    alt: MessageDescriptor;
  }) => {
  const intl = useIntl();

  return <Image alt={intl.formatMessage(alt)} {...restProps} />;
};

import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';
import { routes } from 'routes';

interface HeaderLightProps {
  bgcolor?: string;
  color?: string;
  withLogoLink?: boolean;
}

export const HeaderLightLink = forwardRef<
  Nullable<HTMLDivElement>,
  Omit<HeaderLightProps, 'withLogoLink'>
>((props, ref) => {
  return <HeaderLight withLogoLink ref={ref} {...props} />;
});
HeaderLightLink.displayName = 'HeaderLightLink';

export const HeaderLight = forwardRef<
  Nullable<HTMLDivElement>,
  HeaderLightProps
>(({ bgcolor, color, withLogoLink = false }, ref) => {
  const colorLink = normalizeColor(color || 'blue-active', theme);

  return (
    <Box
      ref={ref}
      role="menubar"
      pad="small"
      background={{ color: bgcolor || 'bg-marsha' }}
    >
      {withLogoLink ? (
        <Link to={routes.LOGIN.path} style={{ color: colorLink }}>
          <LogoIcon width={117} height={80} />
        </Link>
      ) : (
        <LogoIcon width={117} height={80} color={color} />
      )}
    </Box>
  );
});
HeaderLight.displayName = 'HeaderLight';

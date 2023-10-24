import { Image } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import { Box, useSiteConfig } from 'lib-components';
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
  const { getSiteConfig } = useSiteConfig();
  const siteConfig = getSiteConfig();
  const showSiteConfigLogo =
    !siteConfig.is_default_site && !!siteConfig.logo_url;

  let Logo = (
    <LogoIcon
      width={117}
      height={80}
      color={withLogoLink ? undefined : color}
    />
  );
  if (showSiteConfigLogo) {
    Logo = (
      <Image
        src={siteConfig.logo_url}
        alt="Home"
        fit="contain"
        alignSelf="start"
      />
    );
  }

  if (withLogoLink) {
    Logo = (
      <Link to={routes.LOGIN.path} style={{ color: colorLink }}>
        {Logo}
      </Link>
    );
  }

  return (
    <Box
      ref={ref}
      role="menubar"
      pad="small"
      background={bgcolor || 'bg-marsha'}
    >
      {Logo}
    </Box>
  );
});
HeaderLight.displayName = 'HeaderLight';

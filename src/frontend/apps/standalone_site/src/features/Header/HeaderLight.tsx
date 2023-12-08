import { Nullable, colorsTokens } from 'lib-common';
import { Box, Image, useSiteConfig } from 'lib-components';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import LogoIcon from 'assets/svg/logo_marsha.svg?react';
import { LanguagePicker } from 'features/Language';
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
  const colorLink = color || colorsTokens['primary-500'];
  const { getSiteConfig } = useSiteConfig();
  const siteConfig = getSiteConfig();
  const showSiteConfigLogo =
    !siteConfig.is_default_site && !!siteConfig.logo_url;

  let Logo = (
    <LogoIcon
      width={117}
      height={80}
      color={withLogoLink ? undefined : colorLink}
    />
  );
  if (showSiteConfigLogo) {
    Logo = <Image src={siteConfig.logo_url} alt="Home" fit="contain" />;
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
      pad={{ right: 'medium', horizontal: 'small', vertical: 'small' }}
      direction="row"
      background={bgcolor || colorsTokens['primary-100']}
      color={colorsTokens['primary-500']}
      justify="space-between"
    >
      {Logo}
      <LanguagePicker />
    </Box>
  );
});
HeaderLight.displayName = 'HeaderLight';

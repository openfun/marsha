import { Facebook, Github, Linkedin, Mail, Twitter } from 'grommet-icons';
import { Breakpoints } from 'lib-common';
import {
  Box,
  StyledLink,
  Text,
  useResponsive,
  useSiteConfig,
} from 'lib-components';
import React from 'react';

import { usePagesApi } from 'features/PagesApi';

import { ReactComponent as WaveIcon } from '../assets/svg/footer-wave.svg';

const Footer = ({ withoutWave }: { withoutWave?: boolean }) => {
  const { isSmallerBreakpoint, breakpoint } = useResponsive();
  const theme = {
    color: '#253961',
    border: '#58698a',
  };
  const linkCss = `
    width: ${
      isSmallerBreakpoint(breakpoint, Breakpoints.small) ? '150px' : 'auto'
    };
    &:hover {
      text-decoration: underline;
    }
  `;

  const { pagesApi } = usePagesApi();
  const { getSiteConfig } = useSiteConfig();
  const siteConfig = getSiteConfig();

  const defaultFooterCopyright = '© 2023 Marsha Education';

  return (
    <Box type="footer" margin={{ top: 'auto' }} color="white" fill="horizontal">
      {!withoutWave && (
        <WaveIcon color={theme.color} height="4vw" style={{ zIndex: 2 }} />
      )}
      <Box
        background={theme.color}
        pad={{
          horizontal: 'small',
        }}
        margin={{
          top: '-1px',
        }}
      >
        <Box
          direction="row"
          align="center"
          margin={{
            vertical: isSmallerBreakpoint(breakpoint, Breakpoints.xsmedium)
              ? 'medium'
              : 'small',
          }}
          gap="0.5rem 1.5rem"
        >
          {pagesApi.map((page) => (
            <StyledLink
              to={`/${page.slug}`}
              css={linkCss}
              key={`link-${page.slug}`}
            >
              <Text color="white">{page.name}</Text>
            </StyledLink>
          ))}
        </Box>
        <Box
          height="1px"
          width="100%"
          background={theme.border}
          margin={{ vertical: 'small' }}
        />
        <Box
          margin={{ bottom: 'small' }}
          justify="space-between"
          direction="row"
          align="center"
        >
          {siteConfig.is_default_site ? (
            <React.Fragment>
              <Text size="small" color="white">
                {defaultFooterCopyright}
              </Text>
              <Box direction="row" gap="small">
                <a
                  href="https://twitter.com/FunMooc"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Twitter color="white" />
                </a>
                <a
                  href="https://www.facebook.com/france.universite.numerique/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Facebook color="white" />
                </a>
                <a
                  href="https://www.linkedin.com/school/franceuniversitenumerique/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Linkedin color="white" />
                </a>
                <a
                  href="https://github.com/openfun"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github color="white" />
                </a>
                <a
                  href="mailto:communication@fun-mooc.fr"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Mail color="white" />
                </a>
              </Box>
            </React.Fragment>
          ) : (
            <Text size="small" color="white">
              {siteConfig.footer_copyright || defaultFooterCopyright}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;

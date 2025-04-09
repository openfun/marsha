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
import { defineMessages, useIntl } from 'react-intl';

import europe from 'assets/img/europe.png';
import franceRelance from 'assets/img/france-relance.png';
import MinistereIcon from 'assets/img/ministere.svg?react';
import { usePagesApi } from 'features/PagesApi';

import WaveIcon from '../assets/svg/footer-wave.svg?react';

const messages = defineMessages({
  financedBy: {
    defaultMessage: 'Financed by the recovery plan',
    description:
      'Text displayed on the footer to indicate that the project is financed by the recovery plan',
    id: 'features.Footer.financedBy',
  },
  altMinistryLogo: {
    defaultMessage: 'Ministry logo',
    description: 'Accessible description for the Ministry logo',
    id: 'features.Footer.altMinistryLogo',
  },
  altFranceRelanceLogo: {
    defaultMessage: 'France Relance logo',
    description: 'Accessible description for the France Relance logo',
    id: 'features.Footer.altFranceRelanceLogo',
  },
  altEuropeLogo: {
    defaultMessage: 'Europe logo',
    description: 'Accessible description for the Europe logo',
    id: 'features.Footer.altEuropeLogo',
  },
});

const Footer = ({ withoutWave }: { withoutWave?: boolean }) => {
  const intl = useIntl();
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

  const defaultFooterCopyright = '© 2025 Marsha Education';

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
          <Box
            align="center"
            display="flex"
            direction={
              isSmallerBreakpoint(breakpoint, Breakpoints.xsmedium)
                ? 'column'
                : 'row'
            }
            gap="xsmall"
            margin={{ top: 'small' }}
          >
            <Text color="white" display="inline-block" width="5em">
              {intl.formatMessage(messages.financedBy)}
            </Text>
            <MinistereIcon
              width="5em"
              role="img"
              aria-label={intl.formatMessage(messages.altMinistryLogo)}
            />
            <img
              src={franceRelance}
              alt={intl.formatMessage(messages.altFranceRelanceLogo)}
              width="55"
            />
            <img
              src={europe}
              alt={intl.formatMessage(messages.altEuropeLogo)}
              width="150"
            />
          </Box>
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

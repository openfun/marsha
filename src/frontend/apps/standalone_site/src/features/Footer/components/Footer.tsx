import { Box, Text } from 'grommet';
import { Facebook, Github, Linkedin, Mail, Twitter } from 'grommet-icons';
import { Breakpoints } from 'lib-common';
import { StyledLink, useResponsive } from 'lib-components';

import { usePagesApi } from 'features/PagesApi';

import { ReactComponent as WaveIcon } from '../assets/svg/footer-wave.svg';

const Footer = () => {
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

  return (
    <Box margin={{ top: 'auto' }} color="white">
      <WaveIcon color={theme.color} height="4vw" style={{ zIndex: 2 }} />
      <Box
        background={{ color: theme.color }}
        pad={{ horizontal: 'medium' }}
        margin={{ top: '-1px' }}
      >
        <Box
          direction="row"
          align="center"
          flex
          margin={{
            top: isSmallerBreakpoint(breakpoint, Breakpoints.xsmedium)
              ? 'medium'
              : 'small',
            bottom: 'small',
          }}
          wrap
          style={{
            gap: '0.5rem 1.5rem',
          }}
        >
          {pagesApi.map((page) => (
            <StyledLink
              to={`/${page.slug}`}
              css={linkCss}
              key={`link-${page.slug}`}
            >
              <Text size="small">{page.name}</Text>
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
          justify="between"
          direction="row"
          align="center"
        >
          <Text size="small">© 2023 Marsha Education</Text>
          <Box direction="row" gap="small">
            <a
              href="https://twitter.com/FunMooc"
              target="_blank"
              rel="noreferrer"
            >
              <Twitter />
            </a>
            <a
              href="https://www.facebook.com/france.universite.numerique/"
              target="_blank"
              rel="noreferrer"
            >
              <Facebook />
            </a>
            <a
              href="https://www.linkedin.com/school/franceuniversitenumerique/"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin />
            </a>
            <a
              href="https://github.com/openfun"
              target="_blank"
              rel="noreferrer"
            >
              <Github />
            </a>
            <a
              href="mailto:communication@fun-mooc.fr"
              target="_blank"
              rel="noreferrer"
            >
              <Mail />
            </a>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;

import { Image, Box, Text, Heading } from 'grommet';
import { StyledLink } from 'lib-components';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import banner from 'assets/img/homepage-banner.png';
import { ContentsShuffle } from 'features/Contents';
import { useMenu } from 'features/Menu';
import { useResponsive } from 'hooks/useResponsive';
import { routes } from 'routes';

const messages = defineMessages({
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'features.HomePage.SeeEverything',
  },
  BannerAlt: {
    defaultMessage: 'Homepage Banner',
    description: 'Alt banner homepage',
    id: 'features.HomePage.BannerAlt',
  },
  BannerTitle: {
    defaultMessage: 'Learn freely',
    description: 'Title banner homepage',
    id: 'features.HomePage.BannerTitle',
  },
  BannerDesc: {
    defaultMessage: 'Online courses to discover, learn, progress and succeed',
    description: 'Desc banner homepage',
    id: 'features.HomePage.BannerTitle',
  },
});

const BannerBox = styled(Box)`
  position: relative;
  display: block;
`;
const TextBannerBox = styled(Box)`
  width: 33%;
  left: 49%;
  top: 23%;
  position: absolute;
`;

interface LayoutProps {
  isFullLayout: boolean;
}
const HeadingBanner = styled(Heading)<LayoutProps>`
  transition: all 0.3s ease-in-out;
  font-family: 'Roboto-Black';
  ${({ isFullLayout }) => `
    font-size: ${isFullLayout ? 'min(5vw, 56px)' : 'min(3vw, 56px)'};
    line-height: ${isFullLayout ? 'min(5vw, 56px)' : 'min(3vw, 56px)'};
  `}
`;
const TextBanner = styled(Text)<LayoutProps>`
  transition: all 0.3s ease-in-out;
  ${({ isFullLayout }) => `
    font-size: ${isFullLayout ? 'min(2.2vw, 23px)' : 'min(1.4vw, 23px)'};
    line-height: ${isFullLayout ? 'min(2.6vw, 26px)' : 'min(1.7vw, 32px)'};
  `}
`;

const HomePage = () => {
  const intl = useIntl();
  const { isSmallerBreakpoint, breakpoint, isDesktop } = useResponsive();
  const { isMenuOpen } = useMenu();
  const [isBannerLoaded, setIsBannerLoaded] = useState(false);

  return (
    <Box margin={{ top: 'medium' }}>
      <BannerBox margin={{ horizontal: 'auto' }}>
        <Image
          src={banner}
          alt={intl.formatMessage(messages.BannerAlt)}
          width="100%"
          onLoad={() => setIsBannerLoaded(true)}
        />
        {isBannerLoaded && (
          <TextBannerBox>
            <HeadingBanner
              level={2}
              margin={{ bottom: '1.3vw', top: '0' }}
              color="blue-content"
              isFullLayout={
                isSmallerBreakpoint(breakpoint, 'xsmedium') ||
                !isMenuOpen(isDesktop)
              }
            >
              {intl.formatMessage(messages.BannerTitle)}
            </HeadingBanner>
            <TextBanner
              weight="bold"
              color="blue-content"
              isFullLayout={
                isSmallerBreakpoint(breakpoint, 'xsmedium') ||
                !isMenuOpen(isDesktop)
              }
            >
              {intl.formatMessage(messages.BannerDesc)}
            </TextBanner>
          </TextBannerBox>
        )}
      </BannerBox>
      <Box margin={{ top: 'medium' }}>
        <Box direction="row" justify="end" margin={{ bottom: 'small' }}>
          <Text weight="bolder" color="blue-content">
            <StyledLink to={`${routes.CONTENTS.path}`}>
              › {intl.formatMessage(messages.SeeEverything)}
            </StyledLink>
          </Text>
        </Box>
        <ContentsShuffle />
      </Box>
    </Box>
  );
};

export default HomePage;

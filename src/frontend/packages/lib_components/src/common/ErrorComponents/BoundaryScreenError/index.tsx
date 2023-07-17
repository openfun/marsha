import { Box, Heading, Image, Paragraph, Stack, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useAppConfig } from '@lib-components/data/stores/useAppConfig';
import { useResponsive } from '@lib-components/hooks/useResponsive';

interface ResponsiveProps {
  isMobile?: boolean;
}

const LeftCircle = styled(Box)`
  box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.1);
  transform: translate(-60%);
`;

const Onomatopoeia = styled(Paragraph)<ResponsiveProps>`
  font-family: 'Roboto-Light';
  letter-spacing: ${({ isMobile }) => (isMobile ? `-0.104rem;` : '-0.183rem')};
`;

const H2Code = styled(Heading)<ResponsiveProps>`
  font-family: 'Roboto-Bold';
  letter-spacing: ${({ isMobile }) => (isMobile ? `-0.157rem` : '-0.392rem')};
`;

const ErrorMessage = styled(Paragraph)<ResponsiveProps>`
  max-width: ${({ isMobile }) => (isMobile ? `90%;` : '338px')};
`;

const messages = {
  altLogo: {
    defaultMessage: 'Marsha logo',
    description:
      'Accessible description for the Marsha logo displayed in the error page',
    id: 'components.ErrorComponents.BoundaryScreenError.altLogo',
  },
  altErrorDrawing: {
    defaultMessage:
      'Error drawing of a person searching something from a telescope',
    description:
      'Accessible description for the Error drawing of a person searching something from a telescope',
    id: 'components.ErrorComponents.BoundaryScreenError.altErrorDrawing',
  },
  onomatopoeia: {
    defaultMessage: 'Ooops !',
    description:
      'Onomatopoeia of a person saying "Ooops !" in a surprised tone',
    id: 'components.ErrorComponents.BoundaryScreenError.onomatopoeia',
  },
  introduceProblem: {
    defaultMessage: 'There seems to be a slight problem:',
    description: 'Sentence to introduce the error message in the error page',
    id: 'components.ErrorComponents.BoundaryScreenError.probleme',
  },
};

interface BoundaryScreenErrorProps {
  code: number;
  message: string;
}

export const BoundaryScreenError = ({
  code,
  message,
}: BoundaryScreenErrorProps) => {
  const appData = useAppConfig();
  const intl = useIntl();
  const { isMobile: isSmall } = useResponsive();

  return (
    <Stack>
      <Box
        height={isSmall ? '100%' : undefined}
        margin={{ right: isSmall ? undefined : '50%' }}
        pad={{ bottom: '2rem' }}
        style={{
          background:
            'linear-gradient(45deg,rgba(255, 11, 57, 0.3) 0%,rgba(3, 92, 205, 0.9) 100%)',
        }}
      >
        <Box
          width={{ max: isSmall ? '200px' : '50%' }}
          margin={{ horizontal: isSmall ? 'none' : 'auto' }}
        >
          <Image
            alt={intl.formatMessage(messages.altLogo)}
            margin={isSmall ? undefined : { horizontal: 'auto' }}
            src={appData.static.img.marshaWhiteLogo}
            fit="contain"
            fill={true}
          />
        </Box>

        <Stack guidingChild="first" anchor="left">
          <Box margin="auto" width="90%">
            <Image
              alt={intl.formatMessage(messages.altErrorDrawing)}
              fit="contain"
              src={appData.static.img.errorMain}
            />
          </Box>
          {!isSmall && (
            <LeftCircle
              background="white"
              round="full"
              width="80px"
              height="80px"
            />
          )}
        </Stack>
      </Box>

      <Box
        margin={isSmall ? undefined : { left: '50%' }}
        height="100%"
        width={isSmall ? '100%' : undefined}
        pad={isSmall ? { bottom: 'small' } : undefined}
        background={isSmall ? undefined : '#f8fafe'}
      >
        <Box
          margin={
            isSmall ? { horizontal: 'auto', top: 'auto' } : { vertical: 'auto' }
          }
          align="center"
          background={isSmall ? 'white' : undefined}
          round="8px"
          width={isSmall ? '95%' : undefined}
          pad={isSmall ? 'medium' : undefined}
          style={{ color: normalizeColor('blue-active', theme) }}
        >
          <Onomatopoeia
            isMobile={isSmall}
            size={isSmall ? '2.5rem' : '4.375rem'}
            margin="none"
          >
            <FormattedMessage {...messages.onomatopoeia} />
          </Onomatopoeia>
          <H2Code
            margin="none"
            level={2}
            size={isSmall ? '3.75rem' : '9.375rem'}
            isMobile={isSmall}
          >
            {code}
          </H2Code>
          <ErrorMessage
            maxLines={3}
            size="0.875rem"
            textAlign="center"
            margin="none"
          >
            {intl.formatMessage(messages.introduceProblem)}
            &nbsp;
            <Text size="0.875rem" weight="bold">
              {message}
            </Text>
          </ErrorMessage>
        </Box>
      </Box>
    </Stack>
  );
};

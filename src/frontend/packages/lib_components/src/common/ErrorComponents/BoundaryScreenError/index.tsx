import { Stack } from 'grommet';
import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { Box, Heading, Image, Text } from '@lib-components/common';
import { useAppConfig } from '@lib-components/data/stores/useAppConfig';
import { useResponsive } from '@lib-components/hooks/useResponsive';

const LeftCircle = styled(Box)`
  box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.1);
  transform: translate(-60%);
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
  code = 500,
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
        >
          <Text
            weight="light"
            className="m-0"
            style={{
              fontSize: isSmall ? '2.5rem' : '4.375rem',
              letterSpacing: isSmall ? `-0.104rem;` : '-0.183rem',
              fontWeight: '200',
            }}
          >
            {intl.formatMessage(messages.onomatopoeia)}
          </Text>
          <Heading
            className={isSmall ? 'm-b' : 'm-xl'}
            level={2}
            fontSize={isSmall ? '3.75rem' : '9.375rem'}
          >
            {code}
          </Heading>
          <Text
            type="p"
            margin="none"
            textAlign="center"
            width={{
              max: '90%',
            }}
          >
            {intl.formatMessage(messages.introduceProblem)}
            &nbsp;
            <Text weight="bold">{message}</Text>
          </Text>
        </Box>
      </Box>
    </Stack>
  );
};

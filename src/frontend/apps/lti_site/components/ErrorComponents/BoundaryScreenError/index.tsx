import { Box, Paragraph, Image, Text } from 'grommet';
import React from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { H2 } from 'components/Headings';
import { LayoutMainArea } from 'components/LayoutMainArea';
import { useAppConfig } from 'data/stores/useAppConfig';
import { colors } from 'utils/theme/theme';

const BoundaryLayoutMainArea = styled(LayoutMainArea)`
  display: flex;
  justify-content: center;
`;

const LeftLayout = styled.div`
  flex: 1;
  display: block;
  text-align: center;
  position: relative;
  overflow: auto;
  background: linear-gradient(
    45deg,
    rgba(255, 11, 57, 0.3) 0%,
    rgba(3, 92, 205, 0.9) 100%
  );
`;

const LeftCircle = styled.div`
  background: rgb(255, 255, 255);
  box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.1);
  height: 18vh;
  width: 18vh;
  border-radius: 100%;
  transform: translate(-68%, 0px);
  position: absolute;
  top: 53%;
`;
const Onomatopoeia = styled.div`
  font-family: 'Roboto-Light';
  font-size: 4.375rem;
  letter-spacing: -0.183rem;
  margin: 0;
`;

const ImageLogo = styled(Image)`
  max-height: 27vh;
`;

const ImageErrorDrawing = styled(Image)`
  max-height: 66vh;
  display: flex;
  margin: auto;
  max-width: inherit;
`;

const RightLayout = styled(Box)`
  flex: 1;
  color: ${colors['blue-active']};
`;

const H2Code = styled(H2)`
  font-size: 9.375rem;
  line-height: normal;
  margin-bottom: 2.5rem;
  font-family: 'Roboto-Bold';
  letter-spacing: -6.27px;
  margin: 0;
`;

const ErrorMessage = styled(Paragraph)`
  max-width: 338px;
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

  return (
    <BoundaryLayoutMainArea>
      <Box
        direction="row"
        height="100vh"
        width="100vw"
        background="#f8fafe"
        gap="1rem"
      >
        <LeftLayout>
          <LeftCircle />
          <ImageLogo
            alt={intl.formatMessage(messages.altLogo)}
            src={appData.static.img.marshaWhiteLogo}
          />
          <ImageErrorDrawing
            alt={intl.formatMessage(messages.altErrorDrawing)}
            fit={'contain'}
            src={appData.static.img.errorMain}
          />
        </LeftLayout>
        <RightLayout className="flex-vh-center">
          <Onomatopoeia>
            <FormattedMessage {...messages.onomatopoeia} />
          </Onomatopoeia>
          <H2Code>{code}</H2Code>
          <ErrorMessage size="0.875rem" textAlign="center" margin="none">
            {intl.formatMessage(messages.introduceProblem)}
            &nbsp;
            <Text size="0.875rem" weight="bold">
              {message}
            </Text>
          </ErrorMessage>
        </RightLayout>
      </Box>
    </BoundaryLayoutMainArea>
  );
};

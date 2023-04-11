import { Box, Text } from 'grommet';
import { StyledLink } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { routes } from 'routes';

import Lives from './Lives';

const messages = defineMessages({
  MyWebinars: {
    defaultMessage: 'My Webinars',
    description: 'My contents page, my webinars title',
    id: 'features.Contents.features.LiveContents.MyWebinars',
  },
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'features.Contents.features.LiveContents.SeeEverything',
  },
});

const BoxText = styled(Box)`
  color: #002c84;
`;

const LiveContents = () => {
  const intl = useIntl();

  return (
    <Box margin={{ top: 'medium' }}>
      <BoxText direction="row" justify="between" margin={{ bottom: 'small' }}>
        <Text weight="bolder">{intl.formatMessage(messages.MyWebinars)}</Text>
        <Text weight="bolder">
          <StyledLink to={`${routes.CONTENTS.subRoutes.LIVE.path}`}>
            › {intl.formatMessage(messages.SeeEverything)}
          </StyledLink>
        </Text>
      </BoxText>
      <Lives withPagination={false} withFilter={false} limit={4} />
    </Box>
  );
};

export default LiveContents;

import { Box, Text } from 'grommet';
import { StyledLink } from 'lib-components';
import { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useContentFeatures } from '../../store/contentsStore';

const messages = defineMessages({
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'features.Contents.SeeEverything',
  },
});

const BoxText = styled(Box)`
  color: #002c84;
`;

interface ContentsProps {
  playlistId?: string;
}

const Contents = ({ playlistId }: ContentsProps) => {
  const intl = useIntl();
  const { samples } = useContentFeatures((state) => ({
    samples: state.featureSamples(playlistId),
  }));
  const queryParam = playlistId ? `?playlist=${playlistId}` : '';

  return (
    <Fragment>
      {samples.map((sample, index) => (
        <Box margin={{ top: 'large' }} key={`content-sample-${index}`}>
          <BoxText
            direction="row"
            justify="between"
            margin={{ bottom: 'small' }}
          >
            <Text weight="bolder">{intl.formatMessage(sample.title)}</Text>
            <Text weight="bolder">
              <StyledLink
                to={{
                  pathname: sample.route,
                  search: queryParam,
                }}
              >
                › {intl.formatMessage(messages.SeeEverything)}
              </StyledLink>
            </Text>
          </BoxText>
          {sample.component}
        </Box>
      ))}
    </Fragment>
  );
};

export default Contents;

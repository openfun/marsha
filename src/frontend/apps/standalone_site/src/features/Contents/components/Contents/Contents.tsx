import { Box, Heading, StyledLink, Text } from 'lib-components';
import { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useContentFeatures } from '../../store/contentsStore';

const messages = defineMessages({
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'features.Contents.SeeEverything',
  },
});

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
        <Box margin={{ top: 'medium' }} key={`content-sample-${index}`}>
          <Box
            color="#002c84"
            direction="row"
            justify="space-between"
            margin={{ bottom: 'small' }}
            align="center"
          >
            <Heading level={3} style={{ margin: '0' }}>
              {intl.formatMessage(sample.title)}
            </Heading>
            <Text weight="bold">
              <StyledLink
                to={{
                  pathname: sample.route,
                  search: queryParam,
                }}
              >
                › {intl.formatMessage(messages.SeeEverything)}
              </StyledLink>
            </Text>
          </Box>
          {sample.component}
        </Box>
      ))}
    </Fragment>
  );
};

export default Contents;
